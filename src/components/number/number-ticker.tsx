import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, type ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { EASE_OUT } from "../../styles/motion";
import { type GlyphCell, glyphStyles, useGlyphCell } from "./use-glyph-cell";

const DIGITS = Array.from({ length: 10 }, (_, digit) => digit);

export type NumberTickerProps = Omit<ViewProps, "children"> & {
  value: number;
  /** Pads with leading zeros to this many digits. */
  pad?: number;
  /** Per-digit roll duration in milliseconds. Defaults to 900. */
  duration?: number;
  /** Delay between digits on the first reveal, in milliseconds. Defaults to 40. */
  stagger?: number;
  prefix?: string;
  suffix?: string;
  /** Inserts locale group separators. */
  locale?: boolean;
  /** Custom formatter for the rounded value. */
  format?: (value: number) => string;
  /** Disables rolling independently of the system preference. */
  disableAnimation?: boolean;
  /** Text style for every glyph, such as `text-3xl font-semibold`. */
  className?: string;
  /** Extra classes for digit columns only. */
  digitClassName?: string;
};

function DigitColumn({
  digit,
  delay,
  duration,
  cell,
  className,
  reduce,
}: {
  digit: number;
  delay: number;
  duration: number;
  cell: GlyphCell;
  className: string;
  reduce: boolean;
}) {
  const offset = useSharedValue(0);

  useEffect(() => {
    const target = -digit * cell.height;
    offset.value = reduce
      ? target
      : withDelay(delay, withTiming(target, { duration, easing: EASE_OUT }));
  }, [cell.height, delay, digit, duration, offset, reduce]);

  const columnStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <View style={[styles.window, { width: cell.width, height: cell.height }]}>
      <Animated.View style={[styles.column, columnStyle]}>
        {DIGITS.map((n) => (
          <Text
            key={n}
            className={className}
            style={[glyphStyles.tabular, { height: cell.height }]}
          >
            {n}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

/** Each digit rolls through a 0–9 column to its new value. */
export function NumberTicker({
  value,
  pad,
  duration = 900,
  stagger = 40,
  prefix,
  suffix,
  locale = false,
  format,
  disableAnimation = false,
  className = "",
  digitClassName = "",
  accessibilityLabel,
  ...props
}: NumberTickerProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const { cell, measurer } = useGlyphCell(className);
  const [entered, setEntered] = useState(false);

  const text = useMemo(() => {
    const rounded = Math.round(value);
    const formatted = format
      ? format(rounded)
      : locale
        ? rounded.toLocaleString()
        : String(rounded);
    return pad ? formatted.padStart(pad, "0") : formatted;
  }, [format, locale, pad, value]);

  // Key glyphs by place value from the right, so a changing digit keeps its
  // column and rolls instead of remounting, and growth adds columns on the left.
  const glyphs = Array.from(text, (char, index) => ({
    char,
    id: `place-${text.length - 1 - index}`,
  }));

  // The stagger is an entrance flourish; later updates roll every digit at once.
  useEffect(() => {
    if (!cell || entered) return;
    const timer = setTimeout(
      () => setEntered(true),
      duration + glyphs.length * stagger,
    );
    return () => clearTimeout(timer);
  }, [cell, duration, entered, glyphs.length, stagger]);

  return (
    <View
      {...props}
      accessible
      accessibilityRole="text"
      accessibilityLabel={
        accessibilityLabel ?? `${prefix ?? ""}${text}${suffix ?? ""}`
      }
      style={[styles.row, props.style]}
    >
      {measurer}
      {prefix ? <Text className={className}>{prefix}</Text> : null}
      {cell ? (
        glyphs.map(({ char, id }, index) =>
          /\d/.test(char) ? (
            <DigitColumn
              key={id}
              digit={Number(char)}
              delay={entered ? 0 : index * stagger}
              duration={duration}
              cell={cell}
              className={`${className} ${digitClassName}`}
              reduce={reduce}
            />
          ) : (
            <Text key={id} className={className}>
              {char}
            </Text>
          ),
        )
      ) : (
        // Hold the space with plain text until the digit cell is measured.
        <Text className={className} style={styles.hidden}>
          {text}
        </Text>
      )}
      {suffix ? <Text className={className}>{suffix}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  window: { overflow: "hidden" },
  column: { position: "absolute", left: 0, right: 0, top: 0 },
  hidden: { opacity: 0 },
});
