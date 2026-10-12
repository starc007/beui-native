import { type ColorValue, StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

/** A straight line in a square viewBox: [x1, y1, x2, y2]. */
export type PathSegment = [x1: number, y1: number, x2: number, y2: number];

export type DrawnPathProps = {
  /** Straight segments drawn in order, like an SVG polyline. */
  segments: PathSegment[];
  /** Rendered width and height in points. */
  size: number;
  /** Stroke width in viewBox units. */
  strokeWidth: number;
  /** Side of the square viewBox the segments are written in. Defaults to 24. */
  viewBox?: number;
  color: ColorValue | undefined;
  /** 0 draws nothing and 1 draws every segment, like SVG `pathLength`. */
  progress: SharedValue<number>;
};

function length([x1, y1, x2, y2]: PathSegment) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Draws a polyline on with rotated Views, so shared components need no SVG
 * library. Round caps extend half a stroke past each end, like SVG's linecap.
 */
export function DrawnPath({
  segments,
  size,
  strokeWidth,
  viewBox = 24,
  color,
  progress,
}: DrawnPathProps) {
  const unit = size / viewBox;
  const stroke = strokeWidth * unit;
  const total = segments.reduce((sum, segment) => sum + length(segment), 0);
  let start = 0;

  return (
    <View style={{ width: size, height: size }}>
      {segments.map((segment) => {
        const from = start / total;
        start += length(segment);
        return (
          <Stroke
            key={segment.join()}
            segment={segment}
            unit={unit}
            stroke={stroke}
            from={from}
            to={start / total}
            progress={progress}
            color={color}
          />
        );
      })}
    </View>
  );
}

function Stroke({
  segment,
  unit,
  stroke,
  from,
  to,
  progress,
  color,
}: {
  segment: PathSegment;
  unit: number;
  stroke: number;
  from: number;
  to: number;
  progress: SharedValue<number>;
  color: ColorValue | undefined;
}) {
  const [x1, y1, x2, y2] = segment;
  const full = length(segment) * unit;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  const animatedStyle = useAnimatedStyle(() => {
    const drawn = interpolate(progress.value, [from, to], [0, 1], "clamp");
    return { opacity: drawn > 0 ? 1 : 0, width: stroke + full * drawn };
  });

  return (
    <Animated.View
      style={[
        styles.stroke,
        {
          left: x1 * unit - stroke / 2,
          top: y1 * unit - stroke / 2,
          height: stroke,
          borderRadius: stroke / 2,
          backgroundColor: color,
          // Rotate around the start point so the stroke grows from it.
          transformOrigin: [stroke / 2, stroke / 2, 0],
          transform: [{ rotate: `${angle}rad` }],
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  stroke: { position: "absolute" },
});
