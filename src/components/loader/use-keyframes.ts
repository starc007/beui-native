import { useEffect } from "react";
import {
  cancelAnimation,
  type EasingFunction,
  type EasingFunctionFactory,
  ReduceMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { EASE_IN_OUT } from "../../styles/motion";

type KeyframeOptions = {
  /** One full pass through the keyframes, in milliseconds. */
  duration: number;
  /** Delay before the first pass only, like Motion's `delay` with `repeat`. */
  delay?: number;
  /** Offsets from 0 to 1 for each keyframe. Defaults to even spacing. */
  times?: number[];
  easing?: EasingFunction | EasingFunctionFactory;
  /** When false, the value rests on its first keyframe. */
  enabled?: boolean;
};

/**
 * Loops a shared value through `values` forever, like a Motion keyframe array
 * with `repeat: Infinity`. Loaders handle reduced motion themselves, so the
 * system preference never cuts these short.
 */
export function useKeyframes(
  values: number[],
  {
    duration,
    delay = 0,
    times,
    easing = EASE_IN_OUT,
    enabled = true,
  }: KeyframeOptions,
) {
  const first = values[0] ?? 0;
  const value = useSharedValue(first);
  // Arrays are rebuilt every render, so depend on their contents.
  const valuesKey = values.join();
  const timesKey = times?.join() ?? "";

  // values and times are tracked by their keys.
  useEffect(() => {
    if (!enabled || values.length < 2) {
      cancelAnimation(value);
      value.value = first;
      return;
    }
    const offsets =
      times ?? values.map((_, index) => index / (values.length - 1));
    const segments = values.slice(1).map((target, index) =>
      withTiming(target, {
        duration:
          ((offsets[index + 1] ?? 1) - (offsets[index] ?? 0)) * duration,
        easing,
        reduceMotion: ReduceMotion.Never,
      }),
    );
    value.value = first;
    value.value = withDelay(
      delay,
      withRepeat(withSequence(...segments), -1),
      ReduceMotion.Never,
    );
    return () => cancelAnimation(value);
  }, [delay, duration, easing, enabled, first, timesKey, value, valuesKey]);

  return value;
}
