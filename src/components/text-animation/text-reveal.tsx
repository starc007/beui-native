import { useEffect } from "react";
import { StyleSheet, Text, View, type ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { EASE_OUT } from "../../styles/motion";

const DEFAULT_SPRING = { stiffness: 140, damping: 26, mass: 1.2 };

type Offset = number | `${number}%`;

export type TextRevealProps = Omit<ViewProps, "children"> & {
  /** One string, or several lines. */
  text: string | string[];
  /** Animates whole words (the default) or single characters. */
  split?: "word" | "char";
  /** Delay between units in milliseconds. Defaults to 90. */
  stagger?: number;
  /** Delay before the first unit in milliseconds. */
  delay?: number;
  /** Rise distance: points, or a percentage of the line height. Defaults to "40%". */
  yOffset?: Offset;
  spring?: { stiffness?: number; damping?: number; mass?: number };
  /** Text style for every unit, such as `text-3xl font-semibold`. */
  className?: string;
  /** Disables the rise independently of the system preference. */
  disableAnimation?: boolean;
};

type WordGroup = { text: string; trailing: string };

/** Splits a line into words, each carrying the whitespace that follows it. */
function toWordGroups(line: string): WordGroup[] {
  const chunks = line.match(/\S+\s*|\s+/g) ?? [];
  return chunks.map((chunk) => {
    const text = chunk.replace(/\s+$/, "");
    return { text, trailing: chunk.slice(text.length) };
  });
}

// Whitespace-only Text can measure zero-width on Android.
const keepSpaces = (value: string) => value.replace(/ /g, " ");

function Unit({
  text,
  delay,
  offset,
  spring,
  reduce,
  className,
}: {
  text: string;
  delay: number;
  offset: Offset;
  spring: typeof DEFAULT_SPRING;
  reduce: boolean;
  className: string;
}) {
  const rise = useSharedValue(0);
  const fade = useSharedValue(0);
  const height = useSharedValue(0);

  useEffect(() => {
    if (reduce) {
      fade.value = withDelay(
        delay * 0.3,
        withTiming(1, { duration: 250, easing: EASE_OUT }),
      );
      rise.value = 1;
      return;
    }
    const { stiffness, damping, mass } = spring;
    rise.value = withDelay(delay, withSpring(1, { stiffness, damping, mass }));
    fade.value = withDelay(
      delay,
      withTiming(1, { duration: 700, easing: EASE_OUT }),
    );
    // Depend on the spring's numbers, not its object identity.
  }, [
    delay,
    fade,
    reduce,
    rise,
    spring.stiffness,
    spring.damping,
    spring.mass,
  ]);

  const percent = typeof offset === "string" ? Number.parseFloat(offset) : null;

  const animatedStyle = useAnimatedStyle(() => {
    const distance =
      percent === null ? (offset as number) : (height.value * percent) / 100;
    return {
      opacity: fade.value,
      transform: [{ translateY: (1 - rise.value) * distance }],
    };
  });

  return (
    <Animated.View
      style={animatedStyle}
      onLayout={({ nativeEvent: { layout } }) => {
        height.value = layout.height;
      }}
    >
      <Text className={className}>{keepSpaces(text)}</Text>
    </Animated.View>
  );
}

/** Words or characters that rise into place on a spring, one after another. */
export function TextReveal({
  text,
  split = "word",
  stagger = 90,
  delay = 0,
  yOffset = "40%",
  spring,
  className = "",
  disableAnimation = false,
  accessibilityLabel,
  ...props
}: TextRevealProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const lines = Array.isArray(text) ? text : [text];
  const physics = { ...DEFAULT_SPRING, ...spring };
  let unitIndex = 0;

  const renderUnit = (unit: string, key: string) => {
    const unitDelay = delay + unitIndex * stagger;
    unitIndex += 1;
    return (
      <Unit
        key={key}
        text={unit}
        delay={unitDelay}
        offset={yOffset}
        spring={physics}
        reduce={reduce}
        className={className}
      />
    );
  };

  return (
    <View
      {...props}
      accessible
      accessibilityLabel={accessibilityLabel ?? lines.join("\n")}
    >
      {lines.map((line, lineIndex) => (
        // Lines and units are positional; the whole tree remounts with new text.
        <View key={`${lineIndex}-${line}`} style={styles.line}>
          {toWordGroups(line).map((group, groupIndex) => {
            const whole = group.text + group.trailing;
            const key = `${groupIndex}-${whole}`;
            if (split !== "char") return renderUnit(whole, key);
            // Each word stays together so lines wrap between words, not inside them.
            return (
              <View key={key} style={styles.word}>
                {Array.from(whole).map((char, charIndex) =>
                  renderUnit(char, `${charIndex}-${char}`),
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: "row", flexWrap: "wrap" },
  word: { flexDirection: "row" },
});
