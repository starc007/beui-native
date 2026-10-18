import { useEffect } from "react";
import type { ColorValue } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { RingGlyph } from "./agent-icons";

/**
 * A spinning ring for busy states. Reduced motion holds it still; the ring
 * still reads as "in progress".
 */
export function SpinGlyph({
  size = 16,
  color,
  reduce,
}: {
  size?: number;
  color?: ColorValue;
  reduce: boolean;
}) {
  const turn = useSharedValue(0);

  useEffect(() => {
    if (reduce) {
      cancelAnimation(turn);
      turn.value = 0;
      return;
    }
    turn.value = 0;
    turn.value = withRepeat(
      withTiming(1, {
        duration: 900,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      }),
      -1,
      false,
    );
    return () => cancelAnimation(turn);
  }, [reduce, turn]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 360}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <RingGlyph size={size} color={color} />
    </Animated.View>
  );
}
