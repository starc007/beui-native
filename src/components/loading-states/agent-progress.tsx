import { useEffect, useState } from "react";
import { StyleSheet, Text, View, type ViewProps } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";

const CYCLE = 1550;
const STAGGER = 140;
const GLYPH = 20;
const GAP = 2;
const CELL = (GLYPH - GAP * 2) / 3;
const EASE = Easing.bezier(0.77, 0, 0.175, 1);

function format(seconds: number) {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${(seconds - minutes * 60).toFixed(1)}s`;
}

function Cell({
  index,
  color,
  reduce,
  running,
}: {
  index: number;
  color: string;
  reduce: boolean;
  running: boolean;
}) {
  // 0 → 1 → 0 each cycle: dim and small, then full, then back.
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!running) {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 200 });
      return;
    }
    pulse.value = 0;
    pulse.value = withDelay(
      index * STAGGER,
      withRepeat(
        withTiming(1, {
          duration: CYCLE / 2,
          easing: EASE,
          reduceMotion: ReduceMotion.Never,
        }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(pulse);
  }, [index, pulse, running]);

  const style = useAnimatedStyle(() => {
    const p = pulse.value;
    return reduce
      ? { opacity: 0.35 + p * 0.45 }
      : { opacity: 0.28 + p * 0.72, transform: [{ scale: 0.72 + p * 0.28 }] };
  }, [reduce]);

  return (
    <Animated.View style={[styles.cell, { backgroundColor: color }, style]} />
  );
}

export type AgentProgressProps = Omit<ViewProps, "children"> & {
  /** Defaults to "Churning". */
  label?: string;
  /** Controlled elapsed time in seconds. Omit it to count from `initialSeconds`. */
  elapsedSeconds?: number;
  /** Where the internal timer starts. Defaults to 0. */
  initialSeconds?: number;
  /** Pauses the internal timer and the glyph. Defaults to true. */
  running?: boolean;
  /** Text size and color utilities, such as `text-base`. */
  className?: string;
  /** Holds the glyph still, independently of the system preference. */
  disableAnimation?: boolean;
};

/**
 * A pulsing 3×3 glyph, a working label and an elapsed timer, for long agent
 * runs. Screen readers hear the label once, not every tick.
 */
export function AgentProgress({
  label = "Churning",
  elapsedSeconds,
  initialSeconds = 0,
  running = true,
  className = "",
  disableAnimation = false,
  accessibilityLabel,
  ...props
}: AgentProgressProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const controlled = elapsedSeconds !== undefined;
  const [internal, setInternal] = useState(initialSeconds);
  const { color } = useResolveClassNames("text-muted");
  const tint = String(color ?? "gray");
  const active = controlled ? true : running;

  // Restarts only when the timer starts or stops; `internal` seeds the start.
  useEffect(() => {
    if (controlled || !running) return;
    const startedAt = Date.now() - internal * 1000;
    const timer = setInterval(
      () => setInternal((Date.now() - startedAt) / 1000),
      100,
    );
    return () => clearInterval(timer);
  }, [controlled, running]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? `${label}, in progress`}
      style={styles.row}
      {...props}
    >
      <View
        style={styles.glyph}
        importantForAccessibility="no-hide-descendants"
      >
        {Array.from({ length: 9 }, (_, index) => (
          <Cell
            key={index}
            index={index}
            color={tint}
            reduce={reduce}
            running={active}
          />
        ))}
      </View>
      <Text className={`text-sm font-medium text-muted ${className}`}>
        {label}
      </Text>
      <Text
        className={`font-mono text-sm text-muted/70 ${className}`}
        style={styles.tabular}
      >
        {format(controlled ? elapsedSeconds : internal)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  glyph: {
    width: GLYPH,
    height: GLYPH,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  cell: { width: CELL, height: CELL, borderRadius: 1 },
  tabular: { fontVariant: ["tabular-nums"] },
});
