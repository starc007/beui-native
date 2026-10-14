import { type Ref, useCallback, useEffect, useState } from "react";
import {
  type GestureResponderEvent,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  ReduceMotion,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { DrawnPath, type PathSegment } from "../../primitives/drawn-path";
import { type IconSource, renderIcon } from "../../primitives/render-icon";
import { SPRING_PRESS } from "../../styles/motion";

// One spring drives everything: a 0 to 1 progress that the width, the
// revealed content's fade and slide, and the surface's tint all read from.
// Folding is opening played backward, overshoot included, and a tap
// mid-motion reverses from wherever it is. Tuned quicker than the web
// version's continuity spring, like a native control under a finger, with a
// hint of give at the end.
const CONTINUITY = {
  stiffness: 320,
  damping: 22,
  mass: 0.8,
  reduceMotion: ReduceMotion.System,
};
const PRESS_SCALE = 0.96;

const BUTTON_HEIGHT = 44;
const BUTTON_PAD = 4;
// How narrow the outline may dip while a fold overshoots past closed.
const MIN_WIDTH = 30;
const ICON_SLOT = 36;
// The label's trailing space inside the open pill.
const LABEL_END = 12;
// How far revealed content slides as it appears.
const SLIDE = 8;
const CHIP_HEIGHT = 40;
const ACTION_WIDTH = 32;
const CHIP_PAD = 12;
// The label's trailing padding once the action has made room.
const CHIP_PAD_OPEN = 4;
const CLOSE: PathSegment[] = [
  [18, 6, 6, 18],
  [6, 6, 18, 18],
];

type ExpandableState = {
  /** Controlled state. Omit it and use `defaultExpanded` for uncontrolled use. */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

function useExpandableState({
  expanded,
  defaultExpanded = false,
  onExpandedChange,
}: ExpandableState) {
  const [internal, setInternal] = useState(defaultExpanded);
  const controlled = expanded !== undefined;
  const current = expanded ?? internal;
  const setExpanded = useCallback(
    (next: boolean) => {
      if (!controlled) setInternal(next);
      onExpandedChange?.(next);
    },
    [controlled, onExpandedChange],
  );
  return [current, setExpanded] as const;
}

/** The control's one progress value: springs to 1 open and 0 folded. */
function useProgress(open: boolean, reduce: boolean) {
  const progress = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    const target = open ? 1 : 0;
    progress.value = reduce ? target : withSpring(target, CONTINUITY);
  }, [open, progress, reduce]);
  return progress;
}

/**
 * Fade and slide for revealed content, read from the shared progress, with an
 * optional quarter turn in for icons.
 */
function useRevealStyle(progress: SharedValue<number>, turn = 0) {
  return useAnimatedStyle(() => {
    const p = progress.value;
    return {
      // Content appears over the back part of the way open, so it's never
      // seen squeezed in a surface still too narrow for it.
      opacity: interpolate(p, [0.3, 0.9], [0, 1], Extrapolation.CLAMP),
      transform: [
        {
          translateX: interpolate(p, [0, 1], [-SLIDE, 0], Extrapolation.CLAMP),
        },
        { rotate: `${turn * (1 - Math.min(1, Math.max(0, p)))}deg` },
      ],
    };
  });
}

/**
 * The surface tints and its outline firms up as it opens, so an open control
 * reads as on at a glance. Both follow the same progress as the motion.
 */
function useSurfaceStyle(progress: SharedValue<number>) {
  const { backgroundColor: tint } = useResolveClassNames("bg-foreground/5");
  const rest = useResolveClassNames("border-border");
  const strong = useResolveClassNames("border-border-strong");
  // On web, borders resolve per side.
  const from = String(rest.borderColor ?? rest.borderTopColor ?? "transparent");
  const to = String(
    strong.borderColor ?? strong.borderTopColor ?? "transparent",
  );
  const fill = String(tint ?? "transparent");
  return useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, progress.value));
    return {
      backgroundColor: interpolateColor(p, [0, 1], ["transparent", fill]),
      borderColor: interpolateColor(p, [0, 1], [from, to]),
    };
  });
}

/** Sinks a pressable surface slightly while a finger is on it. */
function usePress(enabled: boolean) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return {
    style,
    onPressIn: () => {
      if (enabled) scale.value = withSpring(PRESS_SCALE, SPRING_PRESS);
    },
    onPressOut: () => {
      if (enabled) scale.value = withSpring(1, SPRING_PRESS);
    },
  };
}

export type ExpandableButtonProps = Omit<PressableProps, "children" | "style"> &
  ExpandableState & {
    /** A component given `{ size, color }`, or a prebuilt element. */
    icon: IconSource;
    label: string;
    /** Moves without springing, independently of the system preference. */
    disableAnimation?: boolean;
    className?: string;
    labelClassName?: string;
    ref?: Ref<View>;
  };

/**
 * A round icon button that springs open to reveal its label when pressed, and
 * folds back the same way on the next press.
 */
export function ExpandableButton({
  icon,
  label,
  expanded,
  defaultExpanded,
  onExpandedChange,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  disableAnimation = false,
  className = "",
  labelClassName = "",
  accessibilityLabel,
  ref,
  ...props
}: ExpandableButtonProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const [open, setOpen] = useExpandableState({
    expanded,
    defaultExpanded,
    onExpandedChange,
  });
  const { color: foreground } = useResolveClassNames("text-foreground");
  const [labelWidth, setLabelWidth] = useState(0);
  const press = usePress(!reduce && !disabled);
  const progress = useProgress(open, reduce);
  const revealStyle = useRevealStyle(progress);
  const surfaceStyle = useSurfaceStyle(progress);

  // The pill grows by the label's width. Past closed, a fold's overshoot dips
  // the outline a few points narrower, mirroring the overshoot past open,
  // while the icon below stays centered and full size.
  const pillStyle = useAnimatedStyle(() => ({
    width: Math.max(MIN_WIDTH, BUTTON_HEIGHT + labelWidth * progress.value),
  }));
  const iconStyle = useAnimatedStyle(() => {
    const width = Math.max(
      MIN_WIDTH,
      BUTTON_HEIGHT + labelWidth * progress.value,
    );
    return {
      transform: [{ translateX: Math.min(0, width - BUTTON_HEIGHT) / 2 }],
    };
  });

  const labelClasses = `text-sm font-medium text-foreground ${labelClassName}`;

  return (
    <Animated.View style={[styles.hug, press.style]}>
      <Pressable
        {...props}
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        aria-expanded={open}
        aria-disabled={disabled ?? false}
        disabled={disabled}
        onPress={(event: GestureResponderEvent) => {
          onPress?.(event);
          if (!event.defaultPrevented) setOpen(!open);
        }}
        onPressIn={(event) => {
          press.onPressIn();
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          press.onPressOut();
          onPressOut?.(event);
        }}
      >
        <Animated.View
          className={`flex-row items-center overflow-hidden rounded-full border border-border ${disabled ? "opacity-50" : ""} ${className}`}
          style={[styles.button, pillStyle, surfaceStyle]}
        >
          <Animated.View style={[styles.iconSlot, iconStyle]}>
            {renderIcon(icon, { size: 16, color: foreground as string })}
          </Animated.View>
          <Animated.View style={[styles.label, revealStyle]}>
            <Text numberOfLines={1} className={labelClasses}>
              {label}
            </Text>
          </Animated.View>
        </Animated.View>
      </Pressable>

      {/* Measured at its natural width, outside the clipped pill. */}
      <View pointerEvents="none" style={styles.measure}>
        <Text
          numberOfLines={1}
          className={labelClasses}
          onLayout={({ nativeEvent }) =>
            setLabelWidth(Math.ceil(nativeEvent.layout.width) + LABEL_END)
          }
        >
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}

export type ExpandableChipProps = ExpandableState & {
  label: string;
  /** Replaces the X. A component given `{ size, color }`, or an element. */
  actionIcon?: IconSource;
  /** Names the action for screen readers, such as "Remove React". */
  actionLabel: string;
  onAction?: () => void;
  /** Folds the chip after its action runs. Defaults to true. */
  collapseOnAction?: boolean;
  disabled?: boolean;
  /** Moves without springing, independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
  labelClassName?: string;
};

/**
 * A chip that springs open to reveal a trailing action, such as remove, when
 * its label is pressed, and folds back the same way.
 */
export function ExpandableChip({
  label,
  actionIcon,
  actionLabel,
  onAction,
  collapseOnAction = true,
  expanded,
  defaultExpanded,
  onExpandedChange,
  disabled = false,
  disableAnimation = false,
  className = "",
  labelClassName = "",
}: ExpandableChipProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const [open, setOpen] = useExpandableState({
    expanded,
    defaultExpanded,
    onExpandedChange,
  });
  const { color: muted } = useResolveClassNames("text-muted");
  const drawn = useSharedValue(1);
  const press = usePress(!reduce && !disabled);
  const progress = useProgress(open, reduce);
  // The X turns in as it appears.
  const revealStyle = useRevealStyle(progress, -90);
  const surfaceStyle = useSurfaceStyle(progress);

  // Opening, the action slot grows while the label's trailing padding gives
  // some of its room back, so the chip widens by their difference. Past
  // closed, the padding alone takes up the fold's overshoot, narrowing the
  // chip by as much as opening's overshoot widens it.
  const slotStyle = useAnimatedStyle(() => ({
    width: Math.max(0, ACTION_WIDTH * progress.value),
  }));
  const labelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const grow = ACTION_WIDTH - (CHIP_PAD - CHIP_PAD_OPEN);
    return {
      paddingRight:
        p >= 0
          ? CHIP_PAD - (CHIP_PAD - CHIP_PAD_OPEN) * p
          : CHIP_PAD + grow * p,
    };
  });

  return (
    <Animated.View
      className={`flex-row items-center overflow-hidden rounded-full border border-border ${disabled ? "opacity-50" : ""} ${className}`}
      style={[styles.chip, styles.hug, press.style, surfaceStyle]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        onPress={() => setOpen(!open)}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
      >
        <Animated.View style={[styles.chipLabel, labelStyle]}>
          <Text
            numberOfLines={1}
            className={`text-sm font-medium text-foreground ${labelClassName}`}
          >
            {label}
          </Text>
        </Animated.View>
      </Pressable>
      <Animated.View
        style={[styles.actionSlot, slotStyle]}
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? "auto" : "no-hide-descendants"}
      >
        <Animated.View style={revealStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            disabled={disabled || !open}
            hitSlop={6}
            onPress={() => {
              onAction?.();
              if (collapseOnAction) setOpen(false);
            }}
            className="h-10 w-8 items-center justify-center rounded-full active:opacity-60"
          >
            {actionIcon != null ? (
              renderIcon(actionIcon, { size: 14, color: muted as string })
            ) : (
              <DrawnPath
                segments={CLOSE}
                size={14}
                strokeWidth={2}
                color={muted}
                progress={drawn}
              />
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hug: { alignSelf: "flex-start" },
  button: { height: BUTTON_HEIGHT, padding: BUTTON_PAD - 1 },
  iconSlot: {
    width: ICON_SLOT,
    height: ICON_SLOT,
    alignItems: "center",
    justifyContent: "center",
  },
  // Never squeezed while the pill grows; the pill clips it instead.
  label: { paddingRight: LABEL_END, flexShrink: 0 },
  measure: { position: "absolute", opacity: 0, left: 0, top: 0 },
  chip: { height: CHIP_HEIGHT },
  chipLabel: {
    height: CHIP_HEIGHT - 2,
    justifyContent: "center",
    paddingLeft: CHIP_PAD,
  },
  actionSlot: { height: CHIP_HEIGHT - 2, overflow: "hidden" },
});
