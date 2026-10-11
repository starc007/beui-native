import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { ButtonIconProps } from "./button.types";

// Dependency-free status glyphs drawn with borders, so the button works with any icon set.

function strokeFor(size: number) {
  return Math.max(1.5, size / 9);
}

/** A three-quarter ring that keeps turning; progress is essential, so it ignores reduced motion. */
export function Spinner({ size, color }: ButtonIconProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 800,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      }),
      -1,
      false,
    );
    return () => cancelAnimation(rotation);
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const ring = size * 0.8;
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <Animated.View
        style={[
          {
            width: ring,
            height: ring,
            borderRadius: ring / 2,
            borderWidth: strokeFor(size),
            borderColor: color,
            borderTopColor: "transparent",
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

export function CheckIcon({ size, color }: ButtonIconProps) {
  const stroke = strokeFor(size);
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.3,
          height: size * 0.6,
          marginTop: -size * 0.12,
          borderRightWidth: stroke,
          borderBottomWidth: stroke,
          borderColor: color,
          borderBottomRightRadius: stroke / 2,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}

export function CrossIcon({ size, color }: ButtonIconProps) {
  const stroke = strokeFor(size);
  const bar = {
    position: "absolute" as const,
    width: size * 0.7,
    height: stroke,
    borderRadius: stroke / 2,
    backgroundColor: color,
  };
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View style={[bar, { transform: [{ rotate: "45deg" }] }]} />
      <View style={[bar, { transform: [{ rotate: "-45deg" }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center" },
});
