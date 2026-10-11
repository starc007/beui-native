import { useEffect, useRef, useState } from "react";

export type PresenceItem<T> = {
  key: string;
  value: T;
  /** False for the item present on first render, so it does not animate in. */
  appear: boolean;
  exiting: boolean;
};

/**
 * Keeps replaced items mounted while they animate out, like AnimatePresence.
 * A key that returns while exiting is revived in place.
 */
export function usePresence<T>(
  key: string | null,
  value: T,
  exitDuration: (value: T) => number,
) {
  const [items, setItems] = useState<PresenceItem<T>[]>(() =>
    key === null ? [] : [{ key, value, appear: false, exiting: false }],
  );
  const [currentKey, setCurrentKey] = useState(key);
  const exitDurationRef = useRef(exitDuration);
  exitDurationRef.current = exitDuration;

  // Adjust during render so the new item and the exits start in the same frame.
  if (key !== currentKey) {
    setCurrentKey(key);
    setItems((previous) => {
      const next = previous.map((item) =>
        item.key === key
          ? { ...item, value, exiting: false }
          : { ...item, exiting: true },
      );
      if (key !== null && !previous.some((item) => item.key === key)) {
        next.push({ key, value, appear: true, exiting: false });
      }
      return next;
    });
  }

  const exitingKeys = items
    .filter((item) => item.exiting)
    .map((item) => item.key)
    .join("\n");

  useEffect(() => {
    if (!exitingKeys) return;
    const timers = items
      .filter((item) => item.exiting)
      .map((item) =>
        setTimeout(() => {
          setItems((previous) =>
            previous.filter(
              (candidate) => !(candidate.key === item.key && candidate.exiting),
            ),
          );
        }, exitDurationRef.current(item.value)),
      );
    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
    // Restart removal timers only when the set of exiting items changes.
  }, [exitingKeys]);

  return items;
}
