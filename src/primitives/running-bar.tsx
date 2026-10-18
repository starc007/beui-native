import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { EASE_IN_OUT } from "../styles/motion";

/**
 * A thin bar that slides along a card's bottom edge while work runs. Place it
 * last inside a card with `overflow: hidden`. Reduced motion shows a still tint.
 */
export function RunningBar({ reduce }: { reduce: boolean }) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  useEffect(() => {
    if (reduce || width === 0) return;
    x.value = 0;
    x.value = withRepeat(
      withTiming(1, { duration: 1200, easing: EASE_IN_OUT }),
      -1,
      false,
    );
    return () => cancelAnimation(x);
  }, [reduce, width, x]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -width * 0.35 + x.value * width * 1.35 }],
  }));
  return (
    <View
      pointerEvents="none"
      style={styles.bar}
      onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
    >
      {reduce ? (
        <View style={StyleSheet.absoluteFill} className="bg-primary/40" />
      ) : (
        <Animated.View style={[styles.fill, style]} className="bg-primary" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "35%",
    borderRadius: 1,
  },
});
