import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { usePresence } from "../hooks/use-presence";
import { EASE_OUT, SPRING_SWAP } from "../styles/motion";

const EXIT = { duration: 140, easing: EASE_OUT };
const TRAVEL = 0.9;

/** Progress runs 0 (below) → 1 (resting) → 2 (rolled away above). */
function Layer({
  text,
  appear,
  exiting,
  reduce,
  height,
  className,
  lines,
}: {
  text: string;
  appear: boolean;
  exiting: boolean;
  reduce: boolean;
  height: number;
  className: string;
  lines?: number;
}) {
  const progress = useSharedValue(appear && !reduce ? 0 : 1);

  useEffect(() => {
    if (reduce) {
      progress.value = exiting ? 2 : 1;
      return;
    }
    progress.value = exiting ? withTiming(2, EXIT) : withSpring(1, SPRING_SWAP);
  }, [exiting, progress, reduce]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: Math.max(0, Math.min(1, p <= 1 ? p : 2 - p)),
      transform: [{ translateY: (1 - p) * height * TRAVEL }],
    };
  }, [height]);

  return (
    <Animated.View style={[styles.layer, style]}>
      <Text numberOfLines={lines} className={className}>
        {text}
      </Text>
    </Animated.View>
  );
}

export type RollTextProps = {
  /** Changing the value rolls the new text in; defaults to the text itself. */
  value?: string;
  text: string;
  className: string;
  reduce: boolean;
  /** Lines before truncating. Defaults to 1; pass 0 to wrap freely. */
  numberOfLines?: number;
};

/**
 * Text that rolls up when it changes: the new line rises in from below as the
 * old one rolls up and away. Clipped to its own lines, so only the text moves.
 */
export function RollText({
  value,
  text,
  className,
  reduce,
  numberOfLines = 1,
}: RollTextProps) {
  const lines = numberOfLines === 0 ? undefined : numberOfLines;
  const [height, setHeight] = useState(16);
  const items = usePresence(value ?? text, text, () =>
    reduce ? 0 : EXIT.duration + 40,
  );

  return (
    <View style={styles.slot}>
      {/* Sizes the slot to the current text. */}
      <Text
        numberOfLines={lines}
        className={className}
        style={styles.sizer}
        onLayout={({ nativeEvent }) => setHeight(nativeEvent.layout.height)}
      >
        {text}
      </Text>
      {items.map((item) => (
        <Layer
          key={item.key}
          text={item.value}
          appear={item.appear}
          exiting={item.exiting}
          reduce={reduce}
          height={height}
          className={className}
          lines={lines}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { overflow: "hidden", flexShrink: 1, minWidth: 0 },
  sizer: { opacity: 0 },
  layer: { position: "absolute", left: 0, right: 0, top: 0 },
});
