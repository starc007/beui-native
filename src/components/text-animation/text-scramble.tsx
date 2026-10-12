import { useEffect, useRef, useState } from "react";
import { Text, type TextProps } from "react-native";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";

const DEFAULT_GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@$?/";
// Scrambled glyphs change at most this often, in milliseconds.
const FRAME = 40;

export type TextScrambleProps = Omit<TextProps, "children"> & {
  /** Final text. Changing it scrambles toward the new value. */
  text: string;
  /** Total duration in milliseconds. Defaults to 32 ms per character, within 420–760. */
  duration?: number;
  /** Characters sampled while positions are unresolved. */
  glyphs?: string;
  /** Disables scrambling independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
};

/** Characters scramble through random glyphs and settle left to right on `text`. */
export function TextScramble({
  text,
  duration,
  glyphs = DEFAULT_GLYPHS,
  disableAnimation = false,
  className = "",
  accessibilityLabel,
  ...props
}: TextScrambleProps) {
  const reducedMotion = useReducedMotionPreference();
  const animate = !reducedMotion && !disableAnimation;
  const [display, setDisplay] = useState(text);
  const mounted = useRef(false);

  useEffect(() => {
    // The first text appears as is; later changes scramble.
    if (!mounted.current) {
      mounted.current = true;
      setDisplay(text);
      return;
    }
    if (!animate || !glyphs) {
      setDisplay(text);
      return;
    }

    const characters = Array.from(text);
    const total =
      duration ?? Math.min(760, Math.max(420, characters.length * 32));
    const startedAt = Date.now();
    let lastUpdate = 0;
    let frame = 0;

    const tick = () => {
      const now = Date.now();
      if (now - lastUpdate >= FRAME) {
        lastUpdate = now;
        const settled = Math.floor(
          Math.min((now - startedAt) / total, 1) * characters.length,
        );
        setDisplay(
          characters
            .map((character, index) =>
              index < settled || character === " "
                ? character
                : glyphs[Math.floor(Math.random() * glyphs.length)],
            )
            .join(""),
        );
      }
      if (now - startedAt < total) frame = requestAnimationFrame(tick);
      else setDisplay(text);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, duration, glyphs, text]);

  return (
    <Text
      {...props}
      // Screen readers get the final text, never the scrambled frames.
      accessibilityLabel={accessibilityLabel ?? text}
      className={className}
    >
      {animate ? display : text}
    </Text>
  );
}
