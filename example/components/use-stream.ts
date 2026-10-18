import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reveals `text` a few characters at a time, like a model streaming a reply.
 * `start` begins again from nothing; `done` turns true once it's all shown.
 */
export function useStream(text: string, charsPerSecond = 96, autoStart = true) {
  const [length, setLength] = useState(autoStart ? 0 : text.length);
  const [running, setRunning] = useState(autoStart);
  const startedAt = useRef(Date.now());

  const start = useCallback(() => {
    startedAt.current = Date.now();
    setLength(0);
    setRunning(true);
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const next = Math.floor(
        ((Date.now() - startedAt.current) / 1000) * charsPerSecond,
      );
      if (next >= text.length) {
        setLength(text.length);
        setRunning(false);
      } else {
        setLength(next);
      }
    }, 32);
    return () => clearInterval(timer);
  }, [charsPerSecond, running, text.length]);

  return {
    text: text.slice(0, length),
    done: !running && length >= text.length,
    start,
  };
}
