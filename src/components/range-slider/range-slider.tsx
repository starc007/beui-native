import { type Ref, useCallback, useEffect, useState } from "react";
import {
  type AccessibilityActionEvent,
  Platform,
  StyleSheet,
  View,
  type ViewProps,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { SPRING_GLIDE } from "../../styles/motion";

// Bouncy grab feedback for the thumb's stretch only.
const SPRING_BOUNCY = { stiffness: 500, damping: 14, mass: 0.7 };
const GRAB_STRETCH = 1.35;
// The 4-point thumb starts 8 points inside the track and ends 12 points short
// of the far edge, so it always sits inside the fill's rounded end.
const THUMB_START = 8;
const THUMB_INSET = 20;
// The fill sits in a clip inset 2 points from each side.
const FILL_INSET = 2;
const MAX_TICKS = 50;

const clamp = (value: number, lo: number, hi: number) => {
  "worklet";
  return Math.min(hi, Math.max(lo, value));
};

/**
 * Nearest legal value on [min, max] for the given step. Max counts as a
 * candidate when the step doesn't divide the range, so a finger near the end
 * doesn't snap back onto the last whole step.
 */
export function snapSliderValue(
  next: number,
  min: number,
  max: number,
  step: number,
) {
  "worklet";
  if (!(max > min)) return min;
  if (!(step > 0)) return clamp(next, min, max);
  const whole = Math.floor(Number(((max - min) / step).toFixed(6)));
  const lastWhole = Number((min + whole * step).toFixed(6));
  const toGrid = clamp(
    Math.round((next - min) / step) * step + min,
    min,
    lastWhole,
  );
  const snapped =
    lastWhole < max && Math.abs(next - max) <= Math.abs(next - toGrid)
      ? max
      : toGrid;
  return Number(snapped.toFixed(6));
}

export type RangeSliderProps = Omit<ViewProps, "children"> & {
  /** Controlled value. Omit it and use `defaultValue` for uncontrolled use. */
  value?: number;
  defaultValue?: number;
  /** Called once per step while dragging, and on every other change. */
  onValueChange?: (value: number) => void;
  /** Called when a drag or tap lets go, with the final value. */
  onSlidingComplete?: (value: number) => void;
  /** Defaults to 0. */
  min?: number;
  /** Defaults to 100. */
  max?: number;
  /** Defaults to 1. */
  step?: number;
  disabled?: boolean;
  /** Draws a dot at each step, up to 50 of them. Defaults to true. */
  showTicks?: boolean;
  /**
   * Read instead of the raw number. Pass one when the value carries a unit,
   * such as "72.5 kg" or "35%".
   */
  formatValueText?: (value: number) => string;
  /** Moves without springing, independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
  ref?: Ref<View>;
};

/**
 * A stepped slider: drag or tap anywhere on the track. The bar thumb glides
 * between steps and stretches while held.
 */
export function RangeSlider({
  value,
  defaultValue = 0,
  onValueChange,
  onSlidingComplete,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showTicks = true,
  formatValueText,
  disableAnimation = false,
  className = "",
  style,
  accessibilityLabel,
  ref,
  ...props
}: RangeSliderProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const [internal, setInternal] = useState(defaultValue);
  const [width, setWidth] = useState(0);

  // Collapse inverted or empty ranges and non-positive steps, so the maths
  // below never divides by zero or walks a NaN grid.
  const lo = min;
  const hi = max > min ? max : min;
  const stride = step > 0 ? step : 1;
  const controlled = value !== undefined;
  const current = clamp(controlled ? value : internal, lo, hi);
  const percent = hi > lo ? ((current - lo) / (hi - lo)) * 100 : 0;

  const trackWidth = useSharedValue(0);
  const target = useSharedValue(percent);
  // The last value the gesture reported, so each step notifies only once.
  const reported = useSharedValue(current);
  const grabbed = useSharedValue(0);

  useEffect(() => {
    target.value = percent;
    reported.value = current;
  }, [current, percent, reported, target]);

  const commit = useCallback(
    (next: number) => {
      const clean = snapSliderValue(next, lo, hi, stride);
      if (!controlled) setInternal(clean);
      onValueChange?.(clean);
    },
    [controlled, hi, lo, onValueChange, stride],
  );
  const complete = useCallback(
    (next: number) => onSlidingComplete?.(next),
    [onSlidingComplete],
  );

  // Maps a touch to a value along the thumb's own path, so the thumb lands
  // under the finger rather than under the track's raw proportion.
  const moveTo = (x: number) => {
    "worklet";
    const span = trackWidth.value - THUMB_INSET;
    if (span <= 0) return;
    const ratio = clamp((x - THUMB_START - 2) / span, 0, 1);
    const next = snapSliderValue(lo + ratio * (hi - lo), lo, hi, stride);
    if (next === reported.value) return;
    reported.value = next;
    target.value = hi > lo ? ((next - lo) / (hi - lo)) * 100 : 0;
    scheduleOnRN(commit, next);
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    // Horizontal drags own the slider; vertical ones go on to scroll the page.
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .hitSlop({ vertical: 4 })
    .onStart((event) => {
      grabbed.value = 1;
      moveTo(event.x);
    })
    .onUpdate((event) => {
      moveTo(event.x);
    })
    .onFinalize((_, success) => {
      grabbed.value = 0;
      if (success) scheduleOnRN(complete, reported.value);
    });
  const tap = Gesture.Tap()
    .enabled(!disabled)
    // A finger that travels is a drag or a scroll, not a tap; failing early
    // hands a vertical swipe back to the page.
    .maxDistance(10)
    .hitSlop({ vertical: 4 })
    .onBegin(() => {
      grabbed.value = 1;
    })
    .onEnd((event) => {
      moveTo(event.x);
      scheduleOnRN(complete, reported.value);
    })
    .onFinalize(() => {
      grabbed.value = 0;
    });
  const gesture = Gesture.Race(pan, tap);

  const position = useDerivedValue(() =>
    reduce ? target.value : withSpring(target.value, SPRING_GLIDE),
  );

  const thumbStyle = useAnimatedStyle(() => {
    const span = Math.max(0, trackWidth.value - THUMB_INSET);
    return {
      transform: [
        { translateX: THUMB_START + (span * position.value) / 100 },
        {
          scaleY: reduce
            ? 1
            : withSpring(grabbed.value ? GRAB_STRETCH : 1, SPRING_BOUNCY),
        },
      ],
    };
  });
  // A full-size fill slides in from the left, so its rounded end never
  // stretches. Its edge runs a few points past the thumb at every position.
  const fillStyle = useAnimatedStyle(() => {
    const p = position.value;
    const clip = trackWidth.value - FILL_INSET * 2;
    return {
      transform: [
        {
          translateX: p >= 100 ? 0 : ((p - 100) / 100) * clip + 14 - 0.16 * p,
        },
      ],
    };
  });

  // Floor rather than round, so a range the step doesn't divide stops its dots
  // at the last whole step. toFixed first, because 0.3 / 0.1 is 2.999….
  const steps = Math.floor(Number(((hi - lo) / stride).toFixed(6)));
  const ticks =
    showTicks && steps > 0 && steps <= MAX_TICKS && width > 0
      ? Array.from({ length: steps + 1 }, (_, i) =>
          Number((lo + i * stride).toFixed(6)),
        )
      : [];

  const adjust = (event: AccessibilityActionEvent) => {
    if (disabled) return;
    const delta = event.nativeEvent.actionName === "increment" ? 1 : -1;
    commit(current + delta * stride);
  };
  // Arrow keys, Page Up and Down, Home and End on web, like the web slider.
  const webKeys =
    Platform.OS === "web" && !disabled
      ? {
          focusable: true,
          onKeyDown: (event: { key: string; preventDefault: () => void }) => {
            const map: Record<string, number> = {
              ArrowRight: current + stride,
              ArrowUp: current + stride,
              ArrowLeft: current - stride,
              ArrowDown: current - stride,
              PageUp: current + stride * 10,
              PageDown: current - stride * 10,
              Home: lo,
              End: hi,
            };
            const next = map[event.key];
            if (next !== undefined) {
              event.preventDefault();
              commit(next);
            }
          },
        }
      : {};

  return (
    <GestureDetector gesture={gesture}>
      <View
        {...props}
        {...webKeys}
        ref={ref}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        // The aria props reach every platform, including React Native Web,
        // which ignores accessibilityValue.
        aria-disabled={disabled}
        aria-valuemin={lo}
        aria-valuemax={hi}
        aria-valuenow={current}
        aria-valuetext={formatValueText?.(current)}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={adjust}
        onLayout={(event) => {
          const next = event.nativeEvent.layout.width;
          trackWidth.value = next;
          setWidth(next);
          props.onLayout?.(event);
        }}
        className={`h-10 w-full justify-center overflow-hidden rounded-lg bg-surface ${disabled ? "opacity-50" : ""} ${className}`}
        style={style}
      >
        <View style={styles.fillClip} className="rounded-lg">
          <Animated.View
            style={[StyleSheet.absoluteFill, fillStyle]}
            className="rounded-lg bg-foreground/15"
          />
        </View>

        {ticks.map((tick) => {
          const share = (tick - lo) / (hi - lo);
          return (
            <View
              key={tick}
              style={[
                styles.tick,
                { left: THUMB_INSET / 2 + share * (width - THUMB_INSET) - 2 },
              ]}
              className="bg-foreground/25"
            />
          );
        })}

        <Animated.View
          style={[styles.thumb, thumbStyle]}
          className="bg-foreground"
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fillClip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: FILL_INSET,
    right: FILL_INSET,
    overflow: "hidden",
    pointerEvents: "none",
  },
  tick: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    pointerEvents: "none",
  },
  thumb: {
    position: "absolute",
    left: 0,
    width: 4,
    height: 24,
    borderRadius: 2,
    pointerEvents: "none",
  },
});
