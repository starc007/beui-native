import { type Ref, useEffect, useState } from "react";
import {
  I18nManager,
  StyleSheet,
  Text,
  View,
  type ViewInstance,
  type ViewProps,
} from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { DrawnPath } from "../../primitives/drawn-path";
import { type IconSource, renderIcon } from "../../primitives/render-icon";
import { EASE_OUT } from "../../styles/motion";
import { Loader } from "../loader";

export type SlideButtonState = "idle" | "loading" | "success" | "error";
export type SlideButtonSize = "md" | "lg";

const SIZES = {
  md: { track: 52, icon: 20 },
  lg: { track: 60, icon: 22 },
} as const;
const PAD = 4;
const SETTLE = { duration: 260, easing: EASE_OUT };
const CHECK = { duration: 360, easing: EASE_OUT };

export type SlideButtonProps = Omit<ViewProps, "children"> & {
  /** Shown on the track while idle, such as "Slide to send". */
  label: string;
  /** Read by screen readers while loading. Defaults to `label`. */
  loadingLabel?: string;
  /** Read by screen readers after success. Defaults to `label`. */
  successLabel?: string;
  /**
   * Controlled state. `loading` spins in the thumb, `success` draws a check,
   * and `idle` or `error` glide the thumb back to the start.
   */
  state?: SlideButtonState;
  /** Runs once the thumb passes `threshold` and is let go. */
  onSlideComplete: () => void;
  /** Runs each time the thumb crosses `threshold`, for a haptic tick. */
  onThresholdChange?: (past: boolean) => void;
  /** Share of the track that commits. Defaults to 0.85. */
  threshold?: number;
  size?: SlideButtonSize;
  /** The thumb's idle icon, given `{ size, color }`. Defaults to an arrow. */
  icon?: IconSource;
  /** Replaces the drawn check on success. */
  successIcon?: IconSource;
  disabled?: boolean;
  disableAnimation?: boolean;
  className?: string;
  ref?: Ref<ViewInstance>;
};

function Arrow({ size, color }: { size: number; color: unknown }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={String(color)}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * A track you drag a thumb across to confirm. The fill grows behind the
 * thumb and the label fades as it goes. Let go early and it eases back;
 * past the threshold it eases to the end and calls `onSlideComplete`. Drive
 * `state` to spin while working and draw a check when done. Screen readers
 * get a plain activate action instead of the drag.
 */
export function SlideButton({
  label,
  loadingLabel,
  successLabel,
  state = "idle",
  onSlideComplete,
  onThresholdChange,
  threshold = 0.85,
  size = "lg",
  icon,
  successIcon,
  disabled = false,
  disableAnimation = false,
  className = "",
  style,
  ref,
  ...props
}: SlideButtonProps) {
  const reduce = useReducedMotionPreference() || disableAnimation;
  const { color: onPrimary } = useResolveClassNames("text-on-primary");
  const dims = SIZES[size];
  const thumbSize = dims.track - PAD * 2;
  const direction = I18nManager.isRTL ? -1 : 1;

  const [width, setWidth] = useState(0);
  const span = Math.max(width - thumbSize - PAD * 2, 0);
  const x = useSharedValue(0);
  const past = useSharedValue(false);
  const check = useSharedValue(state === "success" ? 1 : 0);
  const locked = state === "loading" || state === "success";

  useEffect(() => {
    if (state === "idle" || state === "error") {
      x.value = reduce ? 0 : withTiming(0, SETTLE);
      past.value = false;
    } else if (span) {
      x.value = reduce ? span : withTiming(span, SETTLE);
    }
    check.value = state === "success" ? (reduce ? 1 : withTiming(1, CHECK)) : 0;
  }, [state, span, reduce, x, past, check]);

  const crossed = (value: boolean) => onThresholdChange?.(value);
  const gesture = usePanGesture({
    enabled: width > 0 && !locked && !disabled,
    activeOffsetX: [-4, 4],
    failOffsetY: [-12, 12],
    onUpdate: (e) => {
      x.value = Math.min(Math.max(e.translationX * direction, 0), span);
      const now = x.value >= span * threshold;
      if (now !== past.value) {
        past.value = now;
        scheduleOnRN(crossed, now);
      }
    },
    onDeactivate: () => {
      if (x.value >= span * threshold) {
        x.value = reduce ? span : withTiming(span, SETTLE);
        scheduleOnRN(onSlideComplete);
      } else {
        x.value = reduce ? 0 : withTiming(0, SETTLE);
        past.value = false;
      }
    },
  });

  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * direction }],
  }));
  const fill = useAnimatedStyle(() => ({ width: x.value + thumbSize }));
  const text = useAnimatedStyle(() => ({
    opacity: span ? Math.max(1 - (x.value / span) * 1.6, 0) : 1,
  }));

  const spoken =
    state === "loading"
      ? (loadingLabel ?? label)
      : state === "success"
        ? (successLabel ?? label)
        : label;

  return (
    <View
      {...props}
      ref={ref}
      onLayout={(e) => {
        setWidth(e.nativeEvent.layout.width);
        props.onLayout?.(e);
      }}
      accessible
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityState={{
        disabled: disabled || locked,
        busy: state === "loading",
      }}
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={() => {
        if (!locked && !disabled) onSlideComplete();
      }}
      style={[
        { height: dims.track, padding: PAD, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
      className={`justify-center overflow-hidden rounded-full bg-primary/15 ${className}`}
    >
      <Animated.View
        style={[fill, { height: thumbSize, start: PAD }]}
        className="absolute rounded-full bg-primary/25"
      />
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.center, text]}
        pointerEvents="none"
      >
        <Text
          numberOfLines={1}
          className="px-16 text-base font-semibold text-primary"
        >
          {label}
        </Text>
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            thumb,
            styles.center,
            { width: thumbSize, height: thumbSize },
          ]}
          className="rounded-full bg-primary"
        >
          {state === "loading" ? (
            // Loader aligns itself to the start; centre it in the thumb.
            <Loader
              variant="spinner"
              size={dims.icon}
              color={onPrimary}
              style={styles.self}
            />
          ) : state === "success" ? (
            successIcon ? (
              renderIcon(successIcon, { size: dims.icon, color: onPrimary })
            ) : (
              <DrawnPath
                segments={[
                  [6, 12.5, 10, 16.5],
                  [10, 16.5, 18, 8],
                ]}
                size={dims.icon}
                strokeWidth={2.6}
                color={onPrimary}
                progress={check}
              />
            )
          ) : icon ? (
            renderIcon(icon, { size: dims.icon, color: onPrimary })
          ) : (
            <View style={{ transform: [{ scaleX: direction }] }}>
              <Arrow size={dims.icon} color={onPrimary} />
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  self: { alignSelf: "center" },
});
