import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

/**
 * Returns a glyph's color for the current progress. `position` is the glyph's
 * center across the row, from 0 at the left edge to 1 at the right. Must be a
 * worklet.
 */
export type GlyphColor = (
  progress: number,
  position: number,
) => { color: string; opacity: number };

// Splitting into glyphs breaks shaping in connected and complex scripts.
// Latin plus general punctuation (dashes, quotes, the ellipsis), none of which shape.
const SPLIT_SAFE = /^[\u0020-\u007e\u00a0-\u024f\u2000-\u206f]+$/;

export type GlyphRowProps = {
  text: string;
  /** Text style for every glyph. Its color is replaced by `colorAt`. */
  className?: string;
  progress: SharedValue<number>;
  colorAt: GlyphColor;
  style?: ViewStyle;
};

function Glyph({
  char,
  className,
  progress,
  rowWidth,
  colorAt,
}: {
  char: string;
  className?: string;
  progress: SharedValue<number>;
  rowWidth: SharedValue<number>;
  colorAt: GlyphColor;
}) {
  const center = useSharedValue(-1);

  const animatedStyle = useAnimatedStyle(() => {
    const width = rowWidth.value;
    // Until measured, assume the middle so nothing flashes at the edges.
    const position =
      width > 0 && center.value >= 0 ? center.value / width : 0.5;
    return colorAt(progress.value, position);
  });

  return (
    <Animated.Text
      className={className}
      style={animatedStyle}
      onLayout={({ nativeEvent: { layout } }) => {
        center.value = layout.x + layout.width / 2;
      }}
    >
      {char}
    </Animated.Text>
  );
}

/**
 * Text drawn one glyph at a time so each glyph can take its own animated
 * color, standing in for web gradients clipped to text. Scripts that need
 * shaping render as a single glyph so their letters still join.
 */
export function GlyphRow({
  text,
  className,
  progress,
  colorAt,
  style,
}: GlyphRowProps) {
  const rowWidth = useSharedValue(0);
  // Whitespace-only Text can measure zero-width on Android.
  const glyphs = SPLIT_SAFE.test(text)
    ? Array.from(text.replace(/ /g, " "))
    : [text];

  return (
    <View
      style={[styles.row, style]}
      onLayout={({ nativeEvent: { layout } }) => {
        rowWidth.value = layout.width;
      }}
    >
      {glyphs.map((char, index) => (
        <Glyph
          // Position is the glyph's identity within one string.
          key={`${index}-${char}`}
          char={char}
          className={className}
          progress={progress}
          rowWidth={rowWidth}
          colorAt={colorAt}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "baseline" },
});
