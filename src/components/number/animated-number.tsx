import { useEffect, useRef, useState } from "react";
import { Text, type TextProps } from "react-native";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { EASE_OUT } from "../../styles/motion";
import { glyphStyles } from "./use-glyph-cell";

const ease = EASE_OUT.factory();

export type AnimatedNumberProps = Omit<TextProps, "children"> & {
  value: number;
  /** Count duration in milliseconds. Defaults to 1200. */
  duration?: number;
  /** Formats each frame. Defaults to a rounded, locale-grouped integer. */
  format?: (value: number) => string;
  /** Disables counting independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
};

const defaultFormat = (value: number) => Math.round(value).toLocaleString();

/** Counts from the previous value (0 at first) to `value` on beUI's ease-out curve. */
export function AnimatedNumber({
  value,
  duration = 1200,
  format = defaultFormat,
  disableAnimation = false,
  className = "",
  style,
  accessibilityLabel,
  ...props
}: AnimatedNumberProps) {
  const reducedMotion = useReducedMotionPreference();
  const animate = !reducedMotion && !disableAnimation;
  const [display, setDisplay] = useState(animate ? 0 : value);
  const current = useRef(animate ? 0 : value);

  useEffect(() => {
    if (!animate) {
      current.current = value;
      setDisplay(value);
      return;
    }
    // Continue from wherever an interrupted count stopped.
    const start = current.current;
    const startedAt = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      const next = start + (value - start) * ease(t);
      current.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, duration, value]);

  return (
    <Text
      {...props}
      // Screen readers get the final value rather than every frame.
      accessibilityLabel={accessibilityLabel ?? format(value)}
      className={className}
      style={[glyphStyles.tabular, style]}
    >
      {format(display)}
    </Text>
  );
}
