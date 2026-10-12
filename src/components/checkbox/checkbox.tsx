import { type Ref, useEffect, useState } from "react";
import {
  type ColorValue,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { usePresence } from "../../hooks/use-presence";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { EASE_OUT, motion } from "../../styles/motion";

const BOX = 20;
const MARK = 12;
// The web mark is a 24-unit SVG path drawn at 12px with a 3-unit stroke.
const UNIT = MARK / 24;
const STROKE = 3 * UNIT;
const CHECK: Segment[] = [
  [5, 13, 9, 17],
  [9, 17, 19, 7],
];
const DASH: Segment[] = [[6, 12, 18, 12]];
// Tops a 20-point row up to a 48-point touch area.
const HIT_SLOP = { top: 14, bottom: 14, left: 0, right: 0 };
const COLOR_FADE = { duration: 200, reduceMotion: motion.fade.reduceMotion };

type Segment = [x1: number, y1: number, x2: number, y2: number];
type Mark = "check" | "dash";

export type CheckboxProps = Omit<
  PressableProps,
  "children" | "style" | "onPress" | "disabled"
> & {
  /** Controlled state. Omit it and use `defaultChecked` for uncontrolled use. */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Shows a dash and reports a mixed state, for "select all" rows. */
  indeterminate?: boolean;
  disabled?: boolean;
  label?: string;
  /** Supporting text under the label, read as the hint rather than the name. */
  description?: string;
  /** Disables press and mark motion independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
  ref?: Ref<View>;
};

function length([x1, y1, x2, y2]: Segment) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/** One straight stroke that grows from its start point as `progress` covers [from, to]. */
function Stroke({
  segment,
  from,
  to,
  progress,
  color,
}: {
  segment: Segment;
  from: number;
  to: number;
  progress: SharedValue<number>;
  color: ColorValue | undefined;
}) {
  const [x1, y1, x2, y2] = segment;
  const full = length(segment) * UNIT;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  const animatedStyle = useAnimatedStyle(() => {
    const drawn = interpolate(progress.value, [from, to], [0, 1], "clamp");
    return {
      opacity: drawn > 0 ? 1 : 0,
      // Round caps extend half a stroke past each end, like SVG's linecap.
      width: STROKE + full * drawn,
    };
  });

  return (
    <Animated.View
      style={[
        styles.stroke,
        {
          left: x1 * UNIT - STROKE / 2,
          top: y1 * UNIT - STROKE / 2,
          backgroundColor: color,
          transform: [{ rotate: `${angle}rad` }],
        },
        animatedStyle,
      ]}
    />
  );
}

function CheckMark({
  mark,
  appear,
  exiting,
  reduce,
  color,
}: {
  mark: Mark;
  appear: boolean;
  exiting: boolean;
  reduce: boolean;
  color: ColorValue | undefined;
}) {
  const segments = mark === "check" ? CHECK : DASH;
  const presence = useSharedValue(appear && !reduce ? 0 : 1);
  const draw = useSharedValue(appear && !reduce ? 0 : 1);

  useEffect(() => {
    if (reduce) {
      presence.value = exiting ? 0 : 1;
      draw.value = 1;
      return;
    }
    presence.value = withTiming(exiting ? 0 : 1, motion.exit);
    if (!exiting) {
      draw.value = withDelay(
        40,
        withTiming(1, {
          duration: mark === "check" ? 300 : 200,
          easing: EASE_OUT,
        }),
      );
    }
  }, [draw, exiting, mark, presence, reduce]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: presence.value,
    transform: [{ scale: 0.5 + 0.5 * presence.value }],
  }));

  const total = segments.reduce((sum, segment) => sum + length(segment), 0);
  let start = 0;

  return (
    <Animated.View style={[styles.mark, markStyle]}>
      {segments.map((segment) => {
        const from = start / total;
        start += length(segment);
        return (
          <Stroke
            key={segment.join()}
            segment={segment}
            from={from}
            to={start / total}
            progress={draw}
            color={color}
          />
        );
      })}
    </Animated.View>
  );
}

export function Checkbox({
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  indeterminate = false,
  disabled = false,
  label,
  description,
  disableAnimation = false,
  className = "",
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  hitSlop,
  onPressIn,
  onPressOut,
  ref,
  ...props
}: CheckboxProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const checked = checkedProp ?? uncontrolled;
  const showMark = checked || indeterminate;
  const reducedMotion = useReducedMotionPreference();
  const animate = !reducedMotion && !disableAnimation;

  const { backgroundColor: idleFill } = useResolveClassNames("bg-background");
  const { backgroundColor: idleBorder } = useResolveClassNames("bg-muted/50");
  const { backgroundColor: activeFill } = useResolveClassNames("bg-primary");
  const { color: markColor } = useResolveClassNames("text-on-primary");

  const active = useSharedValue(showMark ? 1 : 0);
  const scale = useSharedValue(1);
  const marks = usePresence<Mark | null>(
    showMark ? (indeterminate ? "dash" : "check") : null,
    showMark ? (indeterminate ? "dash" : "check") : null,
    () => motion.exit.duration + 40,
  );

  useEffect(() => {
    const target = showMark ? 1 : 0;
    active.value = animate ? withTiming(target, COLOR_FADE) : target;
  }, [active, animate, showMark]);

  useEffect(() => {
    if (!animate || disabled) {
      cancelAnimation(scale);
      scale.value = 1;
    }
  }, [animate, disabled, scale]);

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      active.value,
      [0, 1],
      [String(idleFill ?? "transparent"), String(activeFill ?? "blue")],
    ),
    borderColor: interpolateColor(
      active.value,
      [0, 1],
      [String(idleBorder ?? "gray"), String(activeFill ?? "blue")],
    ),
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      {...props}
      ref={ref}
      accessible
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint ?? description}
      accessibilityState={{
        ...accessibilityState,
        checked: indeterminate ? "mixed" : checked,
        disabled,
      }}
      aria-checked={indeterminate ? "mixed" : checked}
      aria-disabled={disabled}
      disabled={disabled}
      hitSlop={hitSlop ?? HIT_SLOP}
      className={`self-start flex-row gap-3 ${description ? "items-start" : "items-center"} ${className}`}
      onPress={() => {
        const next = !checked;
        if (checkedProp === undefined) setUncontrolled(next);
        onCheckedChange?.(next);
      }}
      onPressIn={(event) => {
        if (animate) scale.value = withSpring(0.92, motion.press);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (animate) scale.value = withSpring(1, motion.press);
        onPressOut?.(event);
      }}
    >
      <Animated.View
        style={[styles.box, disabled && styles.disabled, boxStyle]}
      >
        {marks.map((item) =>
          item.value ? (
            <CheckMark
              key={item.key}
              mark={item.value}
              appear={item.appear}
              exiting={item.exiting}
              reduce={!animate}
              color={markColor}
            />
          ) : null,
        )}
      </Animated.View>
      {label || description ? (
        <View className={`shrink gap-0.5 ${disabled ? "opacity-60" : ""}`}>
          {label ? (
            <Text className="text-sm leading-5 text-foreground">{label}</Text>
          ) : null}
          {description ? (
            <Text className="text-xs text-muted">{description}</Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: BOX,
    height: BOX,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  disabled: { opacity: 0.6 },
  mark: { position: "absolute", width: MARK, height: MARK },
  stroke: {
    position: "absolute",
    height: STROKE,
    borderRadius: STROKE / 2,
    transformOrigin: [STROKE / 2, STROKE / 2, 0],
  },
});
