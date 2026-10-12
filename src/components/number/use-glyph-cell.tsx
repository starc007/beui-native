import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export type GlyphCell = { width: number; height: number };

/**
 * Measures one tabular "0" in the caller's text style, giving the fixed cell
 * that rolling glyphs travel through. Render `measurer` once inside the
 * component; `cell` stays null until the first layout.
 */
export function useGlyphCell(className: string) {
  const [cell, setCell] = useState<GlyphCell | null>(null);

  const measurer = (
    <View style={glyphStyles.probe}>
      <Text
        className={className}
        style={glyphStyles.tabular}
        onLayout={({ nativeEvent: { layout } }) => {
          setCell((current) =>
            current?.width === layout.width && current.height === layout.height
              ? current
              : { width: layout.width, height: layout.height },
          );
        }}
      >
        0
      </Text>
    </View>
  );

  return { cell, measurer };
}

export const glyphStyles = StyleSheet.create({
  tabular: { fontVariant: ["tabular-nums"] },
  // Wide and invisible so the probe always lays out at its natural size.
  probe: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 10000,
    flexDirection: "row",
    alignItems: "flex-start",
    opacity: 0,
    pointerEvents: "none",
  },
});
