import { type ReactNode, type Ref, useEffect, useRef, useState } from "react";
import {
  type ColorValue,
  StyleSheet,
  View,
  type ViewInstance,
  type ViewProps,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { DrawnPath, type PathSegment } from "../../primitives/drawn-path";
import { type IconSource, renderIcon } from "../../primitives/render-icon";
import { EASE_OUT, SPRING_LAYOUT, SPRING_SWAP } from "../../styles/motion";

export type AnimatedBadgeStatus =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "loading";

export type AnimatedBadgeSize = "sm" | "md";

export type AnimatedBadgeProps = Omit<ViewProps, "children"> & {
  /** Defaults to "neutral". */
  status?: AnimatedBadgeStatus;
  /** Defaults to "md". */
  size?: AnimatedBadgeSize;
  /** The label. Strings and numbers roll when they change. */
  children?: ReactNode;
  /** Replaces the status icon: a component given `{ size, color }`, or an element. */
  icon?: IconSource;
  /** Defaults to true. */
  showIcon?: boolean;
  /** A slow breathing fill. Defaults to true while loading. */
  pulse?: boolean;
  /** Rolls the label when this changes. Defaults to a string or number label, then the status. */
  contentKey?: string | number;
  /** Swaps without rolling, independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
  ref?: Ref<ViewInstance>;
};

// Full class strings, so Uniwind can see every token at build time.
const STATUS_CLASS: Record<AnimatedBadgeStatus, string> = {
  neutral: "border-border bg-surface text-muted",
  info: "border-primary/30 bg-surface text-primary",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  loading: "border-primary/30 bg-surface text-primary",
};

const SIZES = {
  sm: { height: 24, gap: 6, padding: 8, font: 11, icon: 12 },
  md: { height: 32, gap: 8, padding: 12, font: 12, icon: 14 },
} as const;

// The leaving content outruns the entering one, as on the web.
const ROLL_OUT = { duration: 140, easing: EASE_OUT };
const COLOR_FADE = { duration: 300, easing: EASE_OUT };
const PULSE = { duration: 800, easing: Easing.inOut(Easing.ease) };
const SPIN = { duration: 1000, easing: Easing.linear };

const GLYPHS: Partial<Record<AnimatedBadgeStatus, PathSegment[]>> = {
  success: [
    [20, 6, 9, 17],
    [9, 17, 4, 12],
  ],
  danger: [
    [18, 6, 6, 18],
    [6, 6, 18, 18],
  ],
  info: [
    [12, 16, 12, 12],
    [12, 8, 12, 8.01],
  ],
  warning: [
    [12, 3.5, 21.5, 20],
    [21.5, 20, 2.5, 20],
    [2.5, 20, 12, 3.5],
    [12, 9.5, 12, 13.5],
    [12, 16.8, 12, 16.81],
  ],
};

function StatusIcon({
  status,
  size,
  color,
  reduce,
}: {
  status: AnimatedBadgeStatus;
  size: number;
  color: ColorValue | undefined;
  reduce: boolean;
}) {
  const turn = useSharedValue(0);
  // Status glyphs are drawn whole; DrawnPath's progress is for drawing on.
  const drawn = useSharedValue(1);
  const spinning = status === "loading" && !reduce;

  useEffect(() => {
    if (!spinning) return;
    turn.value = withRepeat(withTiming(1, SPIN), -1, false);
    return () => cancelAnimation(turn);
  }, [spinning, turn]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 360}deg` }],
  }));

  const unit = size / 24;
  const ring = {
    width: 18 * unit,
    height: 18 * unit,
    borderRadius: 9 * unit,
    borderWidth: 2 * unit,
    borderColor: color,
  };

  if (status === "neutral") {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={ring} />
      </View>
    );
  }
  if (status === "loading") {
    // Three quarters of a ring, like an open loader circle.
    return (
      <Animated.View
        style={[styles.icon, { width: size, height: size }, spinStyle]}
      >
        <View style={[ring, { borderTopColor: "transparent" }]} />
      </Animated.View>
    );
  }
  const glyph = (
    <DrawnPath
      segments={GLYPHS[status] ?? []}
      size={size}
      strokeWidth={2.4}
      color={color}
      progress={drawn}
    />
  );
  if (status === "info") {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View
          style={[
            ring,
            styles.overlay,
            { width: 20 * unit, height: 20 * unit, borderRadius: 10 * unit },
          ]}
        />
        {glyph}
      </View>
    );
  }
  return glyph;
}

type Layer = { key: string | number; node: ReactNode; leaving: boolean };

/**
 * Rolls its content: the leaving layer slides up and out while the next slides
 * in from below. The slot takes the size of the entering content.
 */
function Roll({
  rollKey,
  distance,
  reduce,
  children,
}: {
  rollKey: string | number;
  distance: number;
  reduce: boolean;
  children: ReactNode;
}) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [shownKey, setShownKey] = useState(rollKey);
  const lastNode = useRef<ReactNode>(children);
  // Content on the badge's first render lands at rest, like initial={false}.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  // A new key turns the content on screen into a leaving layer.
  if (rollKey !== shownKey) {
    const leavingKey = shownKey;
    const leavingNode = lastNode.current;
    setShownKey(rollKey);
    setLayers((current) =>
      reduce
        ? []
        : [
            ...current.filter((layer) => layer.key !== rollKey),
            { key: leavingKey, node: leavingNode, leaving: true },
          ],
    );
  }

  useEffect(() => {
    lastNode.current = children;
  });

  return (
    <View>
      {layers.map((layer) => (
        <RollLayer
          key={`out-${layer.key}`}
          distance={distance}
          leaving
          onDone={() =>
            setLayers((current) => current.filter((item) => item !== layer))
          }
        >
          {layer.node}
        </RollLayer>
      ))}
      <RollLayer
        key={`in-${rollKey}`}
        distance={distance}
        animate={!reduce && mounted.current}
      >
        {children}
      </RollLayer>
    </View>
  );
}

function RollLayer({
  distance,
  leaving = false,
  animate = true,
  onDone,
  children,
}: {
  distance: number;
  leaving?: boolean;
  animate?: boolean;
  onDone?: () => void;
  children: ReactNode;
}) {
  const first = useRef(true);
  const enter = !leaving && animate;
  const offset = useSharedValue(enter ? distance : 0);
  const opacity = useSharedValue(enter ? 0 : 1);

  useEffect(() => {
    if (!first.current) return;
    first.current = false;
    if (leaving) {
      offset.value = withTiming(-distance, ROLL_OUT);
      opacity.value = withTiming(0, ROLL_OUT, (finished) => {
        if (finished && onDone) scheduleOnRN(onDone);
      });
    } else if (enter) {
      offset.value = withSpring(0, SPRING_SWAP);
      opacity.value = withSpring(1, SPRING_SWAP);
    }
  }, [distance, enter, leaving, offset, onDone, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View
      accessibilityElementsHidden={leaving}
      importantForAccessibility={leaving ? "no-hide-descendants" : "auto"}
      style={[leaving ? styles.leaving : null, style]}
    >
      {children}
    </Animated.View>
  );
}

/** A status pill whose icon and label roll when they change. */
export function AnimatedBadge({
  status = "neutral",
  size = "md",
  children,
  icon,
  showIcon = true,
  pulse = status === "loading",
  contentKey,
  disableAnimation = false,
  className = "",
  style,
  accessibilityLabel,
  ref,
  ...props
}: AnimatedBadgeProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const metrics = SIZES[size];
  const colors = useResolveClassNames(STATUS_CLASS[status]);

  // 0 is a real label; booleans and "" from conditional callers are not.
  const hasLabel =
    children != null && typeof children !== "boolean" && children !== "";
  const labelKey =
    contentKey ??
    (typeof children === "string" || typeof children === "number"
      ? children
      : status);

  // Colors blend from the previous status over 300 ms. On web the border
  // resolves per side, so borderTopColor stands in for borderColor.
  const bg = String(colors.backgroundColor ?? "transparent");
  const border = String(
    colors.borderColor ?? colors.borderTopColor ?? "transparent",
  );
  const shown = useRef({ bg, border });
  const blend = useSharedValue(1);
  const palette = useSharedValue({
    fromBg: bg,
    toBg: bg,
    fromBorder: border,
    toBorder: border,
  });
  useEffect(() => {
    const previous = shown.current;
    if (previous.bg === bg && previous.border === border) return;
    shown.current = { bg, border };
    palette.value = {
      fromBg: previous.bg,
      toBg: bg,
      fromBorder: previous.border,
      toBorder: border,
    };
    blend.value = 0;
    blend.value = reduce ? 1 : withTiming(1, COLOR_FADE);
  }, [bg, blend, border, palette, reduce]);

  // The pill springs to its content's natural width.
  const width = useSharedValue(-1);
  const measured = (next: number) => {
    if (width.value < 0 || reduce) width.value = next;
    else width.value = withSpring(next, SPRING_LAYOUT);
  };

  const pillStyle = useAnimatedStyle(() => {
    const p = palette.value;
    return {
      width: width.value < 0 ? undefined : width.value,
      backgroundColor: interpolateColor(
        blend.value,
        [0, 1],
        [p.fromBg, p.toBg],
      ),
      borderColor: interpolateColor(
        blend.value,
        [0, 1],
        [p.fromBorder, p.toBorder],
      ),
    };
  });

  const breath = useSharedValue(0.06);
  const breathing = pulse && !reduce;
  useEffect(() => {
    if (!breathing) {
      breath.value = 0;
      return;
    }
    breath.value = 0.06;
    breath.value = withRepeat(
      withSequence(withTiming(0.18, PULSE), withTiming(0.06, PULSE)),
      -1,
    );
    return () => cancelAnimation(breath);
  }, [breath, breathing]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: breath.value }));

  const textColor = colors.color;
  const label =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : undefined;
  const lineHeight = Math.round(metrics.font * 1.4);

  return (
    <Animated.View
      {...props}
      ref={ref}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
      // Hugs its content unless the caller places it with a self-* class.
      className={`overflow-hidden rounded-full border ${/\bself-/.test(className) ? "" : "self-start"} ${className}`}
      style={[{ minHeight: metrics.height }, pillStyle, style]}
    >
      {breathing ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.passThrough,
            { backgroundColor: textColor },
            pulseStyle,
          ]}
        />
      ) : null}
      <View
        style={[
          styles.row,
          {
            minHeight: metrics.height - 2,
            gap: hasLabel && showIcon ? metrics.gap : 0,
            paddingHorizontal: metrics.padding - 1,
          },
        ]}
        onLayout={(event) => measured(event.nativeEvent.layout.width + 2)}
      >
        {showIcon ? (
          <Roll rollKey={status} distance={12} reduce={reduce}>
            <View style={{ width: metrics.icon, height: metrics.icon }}>
              {icon != null ? (
                renderIcon(icon, {
                  size: metrics.icon,
                  color: textColor as string,
                })
              ) : (
                <StatusIcon
                  status={status}
                  size={metrics.icon}
                  color={textColor}
                  reduce={reduce}
                />
              )}
            </View>
          </Roll>
        ) : null}
        {hasLabel ? (
          <Roll rollKey={labelKey} distance={lineHeight * 0.9} reduce={reduce}>
            <Animated.Text
              numberOfLines={1}
              style={{
                color: textColor,
                fontSize: metrics.font,
                lineHeight,
                fontWeight: "500",
                fontVariant: ["tabular-nums"],
              }}
            >
              {children}
            </Animated.Text>
          </Roll>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    flexShrink: 0,
  },
  icon: { alignItems: "center", justifyContent: "center" },
  overlay: { position: "absolute" },
  leaving: { position: "absolute", top: 0, left: 0 },
  passThrough: { pointerEvents: "none" },
});
