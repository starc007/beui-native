import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { DrawnPath, type PathSegment } from "../../primitives/drawn-path";
import { type IconSource, renderIcon } from "../../primitives/render-icon";
import { EASE_OUT } from "../../styles/motion";

export type BouncyAccordionItem = {
  id: string;
  title: string;
  /** The answer or details. Strings get the default text style. */
  description?: ReactNode;
  /** A component given `{ size, color }`, or a prebuilt element. */
  icon?: IconSource;
  disabled?: boolean;
};

export type BouncyAccordionClassNames = {
  root?: string;
  item?: string;
  trigger?: string;
  title?: string;
  description?: string;
};

export type BouncyAccordionProps = Omit<ViewProps, "children"> & {
  items: BouncyAccordionItem[];
  /** The open item. Omit it and use `defaultValue` for uncontrolled use. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Tapping the open item closes it. Defaults to true. */
  collapsible?: boolean;
  /** Opens and closes without springing, independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
  classNames?: BouncyAccordionClassNames;
};

// The web version's bouncy springs, as duration and damping ratio
// (damping ratio = 1 - bounce).
const ROW = {
  duration: 550,
  dampingRatio: 0.62,
  reduceMotion: ReduceMotion.System,
};
const OPEN = {
  duration: 580,
  dampingRatio: 0.68,
  reduceMotion: ReduceMotion.System,
};
const CLOSE = {
  duration: 460,
  dampingRatio: 0.74,
  reduceMotion: ReduceMotion.System,
};
const CHEVRON = {
  duration: 420,
  dampingRatio: 0.72,
  reduceMotion: ReduceMotion.System,
};
const FADE = { duration: 180, easing: EASE_OUT };

const GAP = 12;
const RADIUS = 28;
const ICON = 16;
const CHEVRON_PATH: PathSegment[] = [
  [6, 9, 12, 15],
  [12, 15, 18, 9],
];

function Row({
  item,
  open,
  startsGroup,
  endsGroup,
  separated,
  reduce,
  classNames,
  onToggle,
}: {
  item: BouncyAccordionItem;
  open: boolean;
  startsGroup: boolean;
  endsGroup: boolean;
  separated: boolean;
  reduce: boolean;
  classNames?: BouncyAccordionClassNames;
  onToggle: () => void;
}) {
  const { color: muted } = useResolveClassNames("text-muted");
  const { backgroundColor: pressedColor } =
    useResolveClassNames("bg-foreground/5");
  const [measured, setMeasured] = useState(0);
  const hasContent = item.description != null;

  const gap = useSharedValue(separated ? GAP : 0);
  const top = useSharedValue(startsGroup ? RADIUS : 0);
  const bottom = useSharedValue(endsGroup ? RADIUS : 0);
  const height = useSharedValue(open && hasContent ? measured : 0);
  const fade = useSharedValue(open ? 1 : 0);
  const turn = useSharedValue(open ? 1 : 0);
  const pressed = useSharedValue(0);
  const drawn = useSharedValue(1);

  const to = useCallback(
    (target: number, spring: typeof ROW) =>
      reduce ? target : withSpring(target, spring),
    [reduce],
  );

  useEffect(() => {
    gap.value = to(separated ? GAP : 0, ROW);
    top.value = to(startsGroup ? RADIUS : 0, ROW);
    bottom.value = to(endsGroup ? RADIUS : 0, ROW);
  }, [bottom, endsGroup, gap, separated, startsGroup, to, top]);

  useEffect(() => {
    height.value = to(open && hasContent ? measured : 0, open ? OPEN : CLOSE);
    fade.value = reduce ? (open ? 1 : 0) : withTiming(open ? 1 : 0, FADE);
    turn.value = to(open ? 1 : 0, CHEVRON);
  }, [fade, hasContent, height, measured, open, reduce, to, turn]);

  // Springs overshoot by design; never let a gap or height dip below zero,
  // which would overlap the neighboring row mid-bounce.
  const rowStyle = useAnimatedStyle(() => ({
    marginTop: Math.max(0, gap.value),
    borderTopLeftRadius: Math.max(0, top.value),
    borderTopRightRadius: Math.max(0, top.value),
    borderBottomLeftRadius: Math.max(0, bottom.value),
    borderBottomRightRadius: Math.max(0, bottom.value),
  }));
  const contentStyle = useAnimatedStyle(() => ({
    height: Math.max(0, height.value),
  }));
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 180}deg` }],
  }));
  const pressStyle = useAnimatedStyle(() => ({ opacity: pressed.value }));

  return (
    <Animated.View
      className={`overflow-hidden bg-surface ${item.disabled ? "opacity-50" : ""} ${classNames?.item ?? ""}`}
      style={rowStyle}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open, disabled: item.disabled }}
        accessibilityLabel={item.title}
        disabled={item.disabled}
        onPress={onToggle}
        onPressIn={() => {
          pressed.value = withTiming(1, { duration: 80 });
        }}
        onPressOut={() => {
          pressed.value = withTiming(0, { duration: 220 });
        }}
        className={`min-h-[54px] flex-row items-center gap-4 px-5 py-3 ${classNames?.trigger ?? ""}`}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: pressedColor },
            pressStyle,
            styles.passThrough,
          ]}
        />
        {item.icon != null ? (
          <View style={styles.icon}>
            {renderIcon(item.icon, { size: ICON, color: muted })}
          </View>
        ) : null}
        <Text
          className={`flex-1 text-[15px] font-medium text-foreground ${classNames?.title ?? ""}`}
        >
          {item.title}
        </Text>
        <Animated.View style={[styles.chevron, chevronStyle]}>
          <DrawnPath
            segments={CHEVRON_PATH}
            size={ICON}
            strokeWidth={2}
            color={muted}
            progress={drawn}
          />
        </Animated.View>
      </Pressable>

      {hasContent ? (
        <Animated.View
          accessibilityElementsHidden={!open}
          importantForAccessibility={open ? "auto" : "no-hide-descendants"}
          style={[styles.content, contentStyle]}
        >
          {/* Measured at its natural height, independent of the animated frame. */}
          <Animated.View
            style={[styles.measure, fadeStyle]}
            onLayout={({ nativeEvent }) => {
              setMeasured(nativeEvent.layout.height);
            }}
          >
            {typeof item.description === "string" ? (
              <Text
                className={`text-[15px] leading-6 text-muted ${classNames?.description ?? ""}`}
              >
                {item.description}
              </Text>
            ) : (
              item.description
            )}
          </Animated.View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

/**
 * A single-open accordion whose open row springs apart from its neighbors,
 * rounding into its own group, while its content bounces open.
 */
export function BouncyAccordion({
  items,
  value,
  defaultValue = null,
  onValueChange,
  collapsible = true,
  disableAnimation = false,
  className = "",
  classNames,
  ...props
}: BouncyAccordionProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const active = value === undefined ? uncontrolled : value;
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const activeIndex = items.findIndex((item) => item.id === active);

  const toggle = useCallback(
    (id: string) => {
      const next = active === id ? (collapsible ? null : id) : id;
      if (next === active) return;
      if (value === undefined) setUncontrolled(next);
      onValueChange?.(next);
    },
    [active, collapsible, onValueChange, value],
  );

  return (
    <View
      {...props}
      className={`w-full ${className} ${classNames?.root ?? ""}`}
    >
      {items.map((item, index) => {
        const open = item.id === active;
        const previousOpen = activeIndex === index - 1;
        const nextOpen = activeIndex === index + 1;
        return (
          <Row
            key={item.id}
            item={item}
            open={open}
            // The open row and its neighbors each round into separate groups.
            startsGroup={open || index === 0 || previousOpen}
            endsGroup={open || index === items.length - 1 || nextOpen}
            separated={index > 0 && (open || previousOpen)}
            reduce={reduce}
            classNames={classNames}
            onToggle={() => toggle(item.id)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  passThrough: { pointerEvents: "none" },
  icon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  chevron: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { overflow: "hidden" },
  measure: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
