import { useEffect, useState } from "react";

/** Applies `next` every `every` milliseconds, for demos with live values. */
export function useTicking<T>(
  next: (value: T) => T,
  initial: T,
  every: number,
) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const timer = setInterval(() => setValue(next), every);
    return () => clearInterval(timer);
  }, [every, next]);
  return value;
}
