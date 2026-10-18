import {
  type ColorValue,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

const BANDS = 8;

export type FadeEdgeProps = {
  /** The surface color the content fades into. */
  color: ColorValue | undefined;
  /** Which edge is solid. Defaults to "bottom". */
  edge?: "top" | "bottom";
  /** Height of the fade in points. */
  height: number;
  style?: ViewStyle;
};

/**
 * A soft edge over clipped content, built from stacked bands so shared
 * components need no gradient library. Ignores touches.
 */
export function FadeEdge({
  color,
  edge = "bottom",
  height,
  style,
}: FadeEdgeProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.edge,
        edge === "bottom" ? styles.bottom : styles.top,
        { height },
        style,
      ]}
    >
      {Array.from({ length: BANDS }, (_, index) => {
        const t = (index + 1) / BANDS;
        return (
          <View
            key={index}
            style={{
              flex: 1,
              backgroundColor: color,
              // Ease the ramp so the fade has no visible first step.
              opacity: edge === "bottom" ? t * t : (1 - t + 1 / BANDS) ** 2,
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  edge: { position: "absolute", left: 0, right: 0 },
  bottom: { bottom: 0 },
  top: { top: 0 },
});
