import { type ReactNode, useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View, type ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { usePresence } from "../../hooks/use-presence";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { CascadeText } from "../../primitives/cascade-text";
import { EASE_OUT } from "../../styles/motion";
import { TextScramble } from "../text-animation/text-scramble";

export type ReasoningTextVariant = "cascade" | "swap" | "scramble";

const DEFAULT_PHRASES = [
  "Thinking",
  "Reading the context",
  "Connecting the details",
  "Forming a response",
];
const SWAP = { duration: 200, easing: EASE_OUT };
const SWAP_REDUCED = { duration: 120 };
const SWAP_DISTANCE = 3;

/** Progress runs 0 (below) → 1 (resting) → 2 (gone above). */
function SwapLayer({
  text,
  appear,
  exiting,
  reduce,
  className,
}: {
  text: string;
  appear: boolean;
  exiting: boolean;
  reduce: boolean;
  className: string;
}) {
  const progress = useSharedValue(appear ? 0 : 1);

  useEffect(() => {
    progress.value = withTiming(exiting ? 2 : 1, reduce ? SWAP_REDUCED : SWAP);
  }, [exiting, progress, reduce]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p <= 1 ? p : 2 - p,
      transform: [{ translateY: reduce ? 0 : (1 - p) * SWAP_DISTANCE }],
    };
  }, [reduce]);

  return (
    <Animated.View style={[styles.layer, style]}>
      <Text numberOfLines={1} className={className}>
        {text}
      </Text>
    </Animated.View>
  );
}

function Swap({
  text,
  index,
  reduce,
  className,
}: {
  text: string;
  index: number;
  reduce: boolean;
  className: string;
}) {
  const items = usePresence(`${index}`, text, () =>
    reduce ? SWAP_REDUCED.duration + 40 : SWAP.duration + 40,
  );
  return items.map((item) => (
    <SwapLayer
      key={item.key}
      text={item.value}
      appear={item.appear}
      exiting={item.exiting}
      reduce={reduce}
      className={className}
    />
  ));
}

const SPINNER = ["|", "/", "-", "\\"];
const SPINNER_STEP = 200;

/** A terminal line spinner set in the phrase's own type, so they share a baseline. */
function Spinner({
  className,
  reduce,
}: {
  className: string;
  reduce: boolean;
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    // Reduced motion slows the swap rather than stopping it; nothing moves.
    const timer = setInterval(
      () => setFrame((current) => (current + 1) % SPINNER.length),
      reduce ? SPINNER_STEP * 2.5 : SPINNER_STEP,
    );
    return () => clearInterval(timer);
  }, [reduce]);
  return (
    <Text className={className} style={styles.spinner}>
      {SPINNER[frame]}
    </Text>
  );
}

export type ReasoningTextProps = Omit<ViewProps, "children"> & {
  /** Status phrases, cycled in order. An ellipsis is added to each. */
  phrases?: string[];
  /** How one phrase gives way to the next. Defaults to "cascade". */
  variant?: ReasoningTextVariant;
  /** Milliseconds each phrase shows. Defaults to 1800, at least 600. */
  interval?: number;
  /** Replaces the spinning ASCII indicator. Pass `null` to hide it. */
  indicator?: ReactNode;
  /** Text size utilities, such as `text-base`. */
  className?: string;
  /** Swaps phrases without motion, independently of the system preference. */
  disableAnimation?: boolean;
};

/**
 * A status line that cycles through what an agent is doing: letters roll in,
 * phrases swap, or glyphs scramble into place. The longest phrase reserves
 * the width, so nothing around it shifts.
 */
export function ReasoningText({
  phrases = DEFAULT_PHRASES,
  variant = "cascade",
  interval = 1800,
  indicator,
  className = "",
  disableAnimation = false,
  accessibilityLabel,
  ...props
}: ReasoningTextProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const [index, setIndex] = useState(0);
  const count = phrases.length;
  const step = Math.max(600, interval);

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), step);
    return () => clearInterval(timer);
  }, [count, step]);

  const phrase = phrases[index % Math.max(count, 1)] ?? "";
  const text = `${phrase}…`;
  const textClass = `text-sm font-medium text-muted ${className}`;

  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilityLabel ?? phrase}
      style={styles.row}
      {...props}
    >
      {indicator === undefined ? (
        <Spinner className={textClass} reduce={reduce} />
      ) : (
        indicator
      )}
      <View style={[styles.slot, variant !== "swap" && styles.overflow]}>
        {/* Lays out every phrase, invisibly, so the slot is as wide as the widest. */}
        <View style={styles.reserve}>
          {phrases.map((candidate, position) => (
            <Text
              key={`${position}-${candidate}`}
              numberOfLines={1}
              className={textClass}
              style={position > 0 && styles.collapsed}
            >
              {`${candidate}…`}
            </Text>
          ))}
        </View>
        {variant === "cascade" ? (
          <View style={styles.layer}>
            <CascadeText
              textKey={`${index}`}
              text={text}
              className={textClass}
              reduce={reduce}
            />
          </View>
        ) : variant === "swap" ? (
          <Swap
            text={text}
            index={index}
            reduce={reduce}
            className={textClass}
          />
        ) : (
          <View style={styles.layer}>
            <TextScramble
              text={text}
              disableAnimation={reduce}
              className={textClass}
              style={styles.tabular}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  slot: { overflow: "hidden" },
  reserve: { opacity: 0 },
  collapsed: { height: 0 },
  // Letter-by-letter layout and scrambling glyphs can run a little wider than
  // the kerned phrase that reserves the width; let them.
  overflow: { overflow: "visible" },
  layer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  tabular: { fontVariant: ["tabular-nums"] },
  spinner: {
    width: 12,
    textAlign: "center",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
