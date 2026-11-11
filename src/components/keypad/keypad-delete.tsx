import Svg, { Path } from "react-native-svg";
import { useResolveClassNames } from "uniwind";
import { KeypadKey, type KeypadKeyProps } from "./keypad-key";

/** A backspace mark. */
function DeleteGlyph({ size }: { size: number }) {
  const { color } = useResolveClassNames("text-foreground");
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="m12 9.5 5 5M17 9.5l-5 5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export type KeypadDeleteProps = Omit<KeypadKeyProps, "value"> & {
  /** Sent to `onKeyPress`. Defaults to "delete". */
  value?: string;
  /** The glyph's size. Defaults to 26. */
  iconSize?: number;
};

/**
 * The delete key: a backspace mark that sends "delete". Pass `onLongPress`
 * to clear everything when it's held.
 */
export function KeypadDelete({
  value = "delete",
  iconSize = 26,
  accessibilityLabel = "Delete",
  children,
  ...props
}: KeypadDeleteProps) {
  return (
    <KeypadKey value={value} accessibilityLabel={accessibilityLabel} {...props}>
      {children ?? <DeleteGlyph size={iconSize} />}
    </KeypadKey>
  );
}
