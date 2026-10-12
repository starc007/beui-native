import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, type ViewProps } from "react-native";
import Animated, {
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { GlyphRow } from "../../primitives/glyph-row";
import { EASE_IN_OUT, EASE_OUT } from "../../styles/motion";

const PALETTE = ["#60a5fa", "#818cf8", "#c084fc", "#fb7185", "#fbbf24"];
// The colored trail spans 14% of the word either side of the sweep.
const TRAIL = 0.14;
const SWEEP_START = -TRAIL;
const SWEEP_END = 1 + TRAIL;

export type ChromaticTextRevealProps = Omit<ViewProps, "children"> & {
  /** Fixed sentence fragment before the changing word. */
  prefix: string;
  /** Words revealed one after another after the prefix. */
  words: string[];
  /** Colors along the moving chromatic edge. */
  colors?: string[];
  /** Sweep duration in milliseconds. Defaults to 1200. */
  duration?: number;
  /** Delay before each sweep in milliseconds. */
  delay?: number;
  /** Rest after a word finishes revealing, in milliseconds. Defaults to 800. */
  pauseDuration?: number;
  /** Returns to the first word after the last. Defaults to true. */
  loop?: boolean;
  /** Text style for the whole sentence, such as `text-3xl font-semibold`. */
  className?: string;
  /** Disables sweeping and cycling independently of the system preference. */
  disableAnimation?: boolean;
};

function Word({
  word,
  className,
  palette,
  foreground,
  duration,
  delay,
  reduce,
  onRevealed,
}: {
  word: string;
  className: string;
  palette: string[];
  foreground: string;
  duration: number;
  delay: number;
  reduce: boolean;
  onRevealed: () => void;
}) {
  const sweep = useSharedValue(reduce ? SWEEP_END : SWEEP_START);
  // A ref keeps a new callback identity from restarting the sweep.
  const revealedRef = useRef(onRevealed);
  revealedRef.current = onRevealed;
  const enter = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (reduce) return;
    enter.value = withTiming(1, { duration: 360, easing: EASE_OUT });
    sweep.value = withDelay(
      delay,
      withTiming(SWEEP_END, { duration, easing: EASE_IN_OUT }),
    );
    const timer = setTimeout(() => revealedRef.current(), delay + duration);
    return () => {
      clearTimeout(timer);
      cancelAnimation(sweep);
    };
  }, [delay, duration, enter, reduce, sweep]);

  const stops = palette.map((_, index) =>
    palette.length === 1
      ? 0
      : -TRAIL + (index / (palette.length - 1)) * TRAIL * 2,
  );

  // Behind the sweep the word is solid; inside the trail it takes the palette;
  // ahead of it the word is still invisible.
  const colorAt = (s: number, position: number) => {
    "worklet";
    const offset = position - s;
    if (offset < -TRAIL) return { color: foreground, opacity: 1 };
    if (offset > TRAIL) return { color: foreground, opacity: 0 };
    return {
      color:
        palette.length === 1
          ? (palette[0] ?? foreground)
          : interpolateColor(offset, stops, palette),
      opacity: 1,
    };
  };

  const enterStyle = useAnimatedStyle(() => ({
    opacity: 0.56 + 0.44 * Math.min(1, enter.value * (360 / 280)),
    transform: [{ translateY: 5 * (1 - enter.value) }],
  }));

  return (
    <Animated.View style={[styles.word, enterStyle]}>
      <GlyphRow
        text={word}
        className={className}
        progress={sweep}
        colorAt={colorAt}
      />
    </Animated.View>
  );
}

/** A sentence whose final word is revealed by a moving chromatic sweep, then cycles. */
export function ChromaticTextReveal({
  prefix,
  words,
  colors = PALETTE,
  duration = 1200,
  delay = 0,
  pauseDuration = 800,
  loop = true,
  className = "",
  disableAnimation = false,
  accessibilityLabel,
  ...props
}: ChromaticTextRevealProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const { color: foreground } = useResolveClassNames("text-foreground");
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const palette = colors.length > 0 ? colors : PALETTE;
  const active = words.length > 0 ? index % words.length : 0;
  const word = words[active] ?? "";
  const sizing = Array.from(new Set(words));

  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!revealed) return;
    const last = active === words.length - 1;
    if (reduce || words.length < 2 || (last && !loop)) return;
    const timer = setTimeout(() => {
      setRevealed(false);
      setIndex((current) => (current + 1) % words.length);
      setCycle((current) => current + 1);
    }, pauseDuration);
    return () => clearTimeout(timer);
  }, [active, loop, pauseDuration, reduce, revealed, words.length]);

  return (
    <View
      {...props}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? `${prefix} ${word}`}
      style={[styles.sentence, props.style]}
    >
      <Text className={className}>
        {prefix}
        {words.length > 0 ? " " : null}
      </Text>
      {words.length > 0 ? (
        <View>
          {/* The widest word reserves space so the sentence never reflows. */}
          {sizing.map((candidate) => (
            <Text key={candidate} className={className} style={styles.sizer}>
              {candidate}
            </Text>
          ))}
          <Word
            key={`${word}-${cycle}`}
            word={word}
            className={className}
            palette={palette}
            foreground={String(foreground ?? "black")}
            duration={duration}
            delay={delay}
            reduce={reduce}
            onRevealed={() => setRevealed(true)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sentence: {
    flexDirection: "row",
    alignItems: "flex-start",
    alignSelf: "flex-start",
  },
  // Stacked invisibly in one cell; the tallest and widest sets the size.
  sizer: { opacity: 0, height: 0, overflow: "hidden" },
  word: { position: "absolute", left: 0, top: 0 },
});
