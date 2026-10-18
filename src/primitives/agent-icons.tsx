import type { ReactNode } from "react";
import type { ColorValue } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

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

export function SearchGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={11} cy={11} r={6.5} />
      <Path d="M16 16l4 4" />
    </Glyph>
  );
}

export function GlobeGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M3.5 12h17M12 3.5c2.4 2.5 3.5 5.3 3.5 8.5s-1.1 6-3.5 8.5c-2.4-2.5-3.5-5.3-3.5-8.5s1.1-6 3.5-8.5z" />
    </Glyph>
  );
}

export function FileGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" />
      <Path d="M14 3.5V8h4.5M9 13h6M9 16.5h4" />
    </Glyph>
  );
}

export function PencilGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16z" />
      <Path d="M13.5 6.5l4 4M14 20h6" />
    </Glyph>
  );
}

export function TerminalGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Rect x={3.5} y={4.5} width={17} height={15} rx={2.5} />
      <Path d="M7.5 10l2.5 2-2.5 2M12.5 15h4" />
    </Glyph>
  );
}

export function WrenchGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M14.5 6.5a4 4 0 0 0 5 5l-8.8 8.8a2.1 2.1 0 0 1-3-3l8.8-8.8a4 4 0 0 1-2-2z" />
    </Glyph>
  );
}

export function SparkleGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M12 4l1.8 4.6L18.5 10.5l-4.7 1.9L12 17l-1.8-4.6-4.7-1.9 4.7-1.9z" />
      <Path d="M18.5 16.5v3M17 18h3" />
    </Glyph>
  );
}

export function MessageGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M20 14.5a2 2 0 0 1-2 2H8.5L4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
    </Glyph>
  );
}

export function ImageGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Rect x={3.5} y={4.5} width={17} height={15} rx={2.5} />
      <Circle cx={9} cy={10} r={1.5} />
      <Path d="M20.5 15.5l-4.5-4.5-9 8.5" />
    </Glyph>
  );
}

export function ShieldGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M12 3.5l7 2.5v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z" />
      <Path d="M9 12l2 2 4-4" />
    </Glyph>
  );
}

export function AlertGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M12 8v4.5M12 16h.01" />
    </Glyph>
  );
}

export function CrossGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </Glyph>
  );
}

export function HelpGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M9.6 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.5M12 16.8h.01" />
    </Glyph>
  );
}

export function ArrowGlyph({
  back = false,
  ...props
}: GlyphProps & { back?: boolean }) {
  return (
    <Glyph {...props}>
      <Path
        d="M5 12h14M13 6l6 6-6 6"
        transform={back ? "rotate(180 12 12)" : undefined}
      />
    </Glyph>
  );
}

export function BracesGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M8.5 4H8a2 2 0 0 0-2 2v3.5A2.5 2.5 0 0 1 3.5 12 2.5 2.5 0 0 1 6 14.5V18a2 2 0 0 0 2 2h.5M15.5 4h.5a2 2 0 0 1 2 2v3.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0-2.5 2.5V18a2 2 0 0 1-2 2h-.5" />
    </Glyph>
  );
}

export function BanGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M6 6l12 12" />
    </Glyph>
  );
}

export function CircleCheckGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M8.5 12.2l2.4 2.4 4.6-4.8" />
    </Glyph>
  );
}

export function CircleCrossGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
    </Glyph>
  );
}

export function ListGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M4 6.5l1.5 1.5L8 5.5M4 13l1.5 1.5L8 12M11.5 7h8.5M11.5 13.5h8.5M11.5 19h8.5M4.5 19h2" />
    </Glyph>
  );
}

/** An open ring, spun by SpinGlyph. */
export function RingGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M20.5 12a8.5 8.5 0 1 1-6-8.1" />
    </Glyph>
  );
}

export function ReplyGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M9.5 7L4.5 12l5 5M4.5 12h10a5 5 0 0 1 5 5v1" />
    </Glyph>
  );
}

export function WrapGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M4 6.5h16M4 12h12.5a3.25 3.25 0 0 1 0 6.5H12M4 18.5h4.5M14 16.5l-2 2 2 2" />
    </Glyph>
  );
}

export function BookGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M12 6.5c-1.6-1.3-4-2-7.5-2v13c3.5 0 5.9.7 7.5 2 1.6-1.3 4-2 7.5-2v-13c-3.5 0-5.9.7-7.5 2zM12 6.5v13" />
    </Glyph>
  );
}

export function ExternalGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M14 4.5h5.5V10M19.5 4.5L11 13M17 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" />
    </Glyph>
  );
}

export function DoubleCheckGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M2.5 12.5l4.5 4.5 9-9.5M12 16.5l.5.5 9-9.5" />
    </Glyph>
  );
}

export function ClockGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M12 7.5V12l3 2" />
    </Glyph>
  );
}
