import Svg, { Circle, Path } from "react-native-svg";
import type { ButtonIconProps } from "../../src";

export function PlusIcon({ size, color }: ButtonIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function ArrowRightIcon({ size, color }: ButtonIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M5 12h14m-6-6 6 6-6 6" />
    </Svg>
  );
}

export function HeartIcon({ size, color }: ButtonIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    </Svg>
  );
}

function Outline({
  size,
  color,
  children,
}: ButtonIconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export function MailIcon(props: ButtonIconProps) {
  return (
    <Outline {...props}>
      <Path d="M4 6h16v12H4z" />
      <Path d="m4 7 8 6 8-6" />
    </Outline>
  );
}

export function SearchIcon(props: ButtonIconProps) {
  return (
    <Outline {...props}>
      <Circle cx={11} cy={11} r={6.5} />
      <Path d="m20 20-4.2-4.2" />
    </Outline>
  );
}

export function EyeIcon(props: ButtonIconProps) {
  return (
    <Outline {...props}>
      <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <Circle cx={12} cy={12} r={3} />
    </Outline>
  );
}

export function EyeOffIcon(props: ButtonIconProps) {
  return (
    <Outline {...props}>
      <Path d="M10.6 5.6A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.4M6.6 6.6A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 5.4-1.7" />
      <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </Outline>
  );
}
