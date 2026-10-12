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

export function CheckIcon(props: ButtonIconProps) {
  return (
    <Outline {...props}>
      <Path d="m5 12.5 4.5 4.5L19 7.5" />
    </Outline>
  );
}

export function PinIcon(props: ButtonIconProps) {
  return (
    <Outline {...props}>
      <Path d="M12 17v4M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6Z" />
    </Outline>
  );
}

export function ClockIcon(props: ButtonIconProps) {
  return (
    <Outline {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M12 7.5V12l3 2" />
    </Outline>
  );
}

export function TrashIcon(props: ButtonIconProps) {
  return (
    <Outline {...props}>
      <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </Outline>
  );
}

export function FileIcon(props: ButtonIconProps) {
  return (
    <Outline {...props}>
      <Path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4Z" />
      <Path d="M14 3v4h4M9 13h6M9 17h6" />
    </Outline>
  );
}

export function UserIcon(props: ButtonIconProps) {
  return (
    <Outline {...props}>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </Outline>
  );
}

export function FlagIcon(props: ButtonIconProps) {
  return (
    <Outline {...props}>
      <Path d="M5 21V4M5 4h11l-2 4 2 4H5" />
    </Outline>
  );
}
