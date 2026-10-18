import type { ReactNode } from "react";
import type { ColorValue } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

type GlyphProps = { size?: number; color?: ColorValue; strokeWidth?: number };

function Glyph({
  size = 16,
  color = "currentColor",
  strokeWidth = 2,
  children,
}: GlyphProps & { children: ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

// Simple 24-unit stroke glyphs shared by the agent components.

export function ChevronDownGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M6 9l6 6 6-6" />
    </Glyph>
  );
}

export function ArrowUpGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
    </Glyph>
  );
}

export function PlusGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M12 5v14M5 12h14" />
    </Glyph>
  );
}

export function StopGlyph({ size = 12, color }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12">
      <Rect x={1} y={1} width={10} height={10} rx={2.5} fill={color} />
    </Svg>
  );
}

export function CheckGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M5 12.5l4.5 4.5L19 7" />
    </Glyph>
  );
}

export function CopyGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Rect x={8.5} y={8.5} width={12} height={12} rx={2.5} />
      <Path d="M15.5 5.5v-.5A2 2 0 0 0 13.5 3h-8.5A2 2 0 0 0 3 5v8.5a2 2 0 0 0 2 2h.5" />
    </Glyph>
  );
}

export function RetryGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" />
      <Path d="M3.5 3.5v5h5" />
    </Glyph>
  );
}

export function ThumbGlyph({
  down = false,
  ...props
}: GlyphProps & { down?: boolean }) {
  return (
    <Glyph {...props}>
      <Path
        d="M7.5 10.5v10M7.5 10.5L11 3.5a2.5 2.5 0 0 1 2.5 2.5v3.5h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20.5H4.5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z"
        transform={down ? "rotate(180 12 12)" : undefined}
      />
    </Glyph>
  );
}
