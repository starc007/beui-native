import { useEffect, useState } from "react";

/**
 * Steps through `frames` on a schedule, for scripted agent runs. Each frame
 * lands `at` milliseconds after the start; changing `run` replays it.
 */
export function useTimeline<T>(
  frames: { at: number; value: T }[],
  run: number,
) {
  const [index, setIndex] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` restarts the timeline
  useEffect(() => {
    setIndex(0);
    const timers = frames.map((frame, position) =>
      setTimeout(() => setIndex(position), frame.at),
    );
    return () => timers.forEach(clearTimeout);
  }, [run]);
  return frames[index]?.value as T;
}
