import { useCallback } from "react";
import {
  type EasingFunction,
  type EasingFunctionFactory,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * Horizontal shake through `keyframes` (in points) over `duration` ms, split
 * evenly like a Motion keyframe array. Callers skip it under reduced motion.
 */
export function useShake(
  keyframes: number[],
  duration: number,
  easing?: EasingFunction | EasingFunctionFactory,
) {
  const offset = useSharedValue(0);
  const step = duration / Math.max(1, keyframes.length - 1);

  const shake = useCallback(() => {
    const [first = 0, ...rest] = keyframes;
    offset.value = first;
    offset.value = withSequence(
      // An explicit `easing: undefined` would replace Reanimated's default.
      ...rest.map((point) =>
        withTiming(
          point,
          easing ? { duration: step, easing } : { duration: step },
        ),
      ),
    );
  }, [easing, keyframes, offset, step]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return { shake, style };
}
