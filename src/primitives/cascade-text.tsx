import { type ReactNode, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { usePresence } from "../hooks/use-presence";
import { motion } from "../styles/motion";

const CASCADE_STAGGER = 25;
const TEXT_DISTANCE = 14;
// Splitting into letters breaks shaping in connected and complex scripts.
// Latin plus general punctuation (dashes, quotes, the ellipsis), none of which shape.
const CASCADE_SAFE = /^[\u0020-\u007e\u00a0-\u024f\u2000-\u206f]+$/;

function letters(text: string) {
  // Whitespace-only Text can measure zero-width on Android.
  return Array.from(text.replace(/ /g, "\u00a0"));
}

function exitDuration(text: string, cascade: boolean) {
  const stagger = cascade ? (text.length - 1) * CASCADE_STAGGER * 0.5 : 0;
  return motion.exit.duration + stagger + 40;
}

/** Progress runs 0 (below) → 1 (resting) → 2 (exited above). */
function Slide({
  appear,
  exiting,
  distance,
  delay,
  reduce,
  children,
}: {
  appear: boolean;
  exiting: boolean;
  distance: number;
  delay: number;
  reduce: boolean;
  children: ReactNode;
}) {
  const progress = useSharedValue(appear ? 0 : 1);

  useEffect(() => {
    if (reduce) {
      progress.value = withTiming(exiting ? 2 : 1, motion.fade);
    } else if (exiting) {
      progress.value = withDelay(delay / 2, withTiming(2, motion.exit));
    } else {
      progress.value = withDelay(delay, withSpring(1, motion.swap));
    }
  }, [delay, exiting, progress, reduce]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: Math.min(1, Math.max(0, p <= 1 ? p : 2 - p)),
      transform: [{ translateY: reduce ? 0 : (1 - p) * distance }],
    };
  }, [distance, reduce]);

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

function Label({
  text,
  cascade,
  className,
}: {
  text: string;
  cascade: boolean;
  className: string;
}) {
  return cascade ? (
    letters(text).map((char, index) => (
      <Text key={index} className={className}>
        {char}
      </Text>
    ))
  ) : (
    <Text numberOfLines={1} className={className}>
      {text}
    </Text>
  );
}

export type CascadeTextProps = {
  /** Changing the key swaps in `text`, even when the text itself repeats. */
  textKey: string;
  text: string;
  /** Text style applied to every letter. */
  className: string;
  reduce: boolean;
};

/**
 * Letter-by-letter slot roll: old letters roll up and away as new ones spring
 * in from below, left to right, while the width springs to fit. Shared by
 * StatefulButton and TextCascade.
 */
export function CascadeText({
  textKey,
  text,
  className,
  reduce,
}: CascadeTextProps) {
  const canCascade = (value: string) => !reduce && CASCADE_SAFE.test(value);
  const items = usePresence(textKey, text, (value) =>
    reduce ? motion.fade.duration + 40 : exitDuration(value, canCascade(value)),
  );
  const [measured, setMeasured] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const width = useSharedValue(0);

  const widthStyle = useAnimatedStyle(() => ({ width: width.value }));
  const labelClass = className;
  const distance = measured ? measured.height * 1.05 : 20;

  return (
    <Animated.View
      style={[
        styles.textSlot,
        measured && { height: measured.height },
        measured && widthStyle,
      ]}
    >
      {/* Measures the incoming label with the same per-letter layout it renders with. */}
      <View style={styles.measureHost}>
        <View
          style={styles.row}
          onLayout={({ nativeEvent: { layout } }) => {
            if (measured) {
              width.value = reduce
                ? layout.width
                : withSpring(layout.width, motion.swap);
            } else {
              width.value = layout.width;
            }
            setMeasured({ width: layout.width, height: layout.height });
          }}
        >
          <Label text={text} cascade={canCascade(text)} className={className} />
        </View>
      </View>

      {items.map((item) => {
        const cascade = canCascade(item.value);
        return (
          <View key={item.key} style={[styles.row, measured && styles.layer]}>
            {cascade ? (
              letters(item.value).map((char, index) => (
                <Slide
                  key={index}
                  appear={item.appear}
                  exiting={item.exiting}
                  distance={distance}
                  delay={index * CASCADE_STAGGER}
                  reduce={reduce}
                >
                  <Text className={labelClass}>{char}</Text>
                </Slide>
              ))
            ) : (
              <Slide
                appear={item.appear}
                exiting={item.exiting}
                distance={TEXT_DISTANCE}
                delay={0}
                reduce={reduce}
              >
                <Text numberOfLines={1} className={labelClass}>
                  {item.value}
                </Text>
              </Slide>
            )}
          </View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  textSlot: { overflow: "hidden", flexShrink: 0 },
  row: { flexDirection: "row", alignItems: "center" },
  layer: { position: "absolute", left: 0, top: 0 },
  measureHost: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 10000,
    flexDirection: "row",
    alignItems: "flex-start",
    opacity: 0,
    pointerEvents: "none",
  },
});
