import { type ReactNode, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import {
  KeypadContext,
  type KeypadSize,
  type KeypadVariant,
} from "./keypad-context";
import { KeypadDelete } from "./keypad-delete";
import { KeypadKey } from "./keypad-key";
import { KeypadRow } from "./keypad-row";
import { KeypadSpacer } from "./keypad-spacer";

/** Ready-made layouts for when no keys are passed in. */
export type KeypadLayout = "decimal" | "number" | "pin";

const LETTERS = [
  "",
  "",
  "ABC",
  "DEF",
  "GHI",
  "JKL",
  "MNO",
  "PQRS",
  "TUV",
  "WXYZ",
];
const DIGITS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

export type KeypadProps = Omit<ViewProps, "children"> & {
  /** Gets each key's value, such as "7", "." or "delete". */
  onKeyPress?: (key: string) => void;
  /** Flat keys with a backdrop that lights, or round passcode keys. Defaults to plain. */
  variant?: KeypadVariant;
  size?: KeypadSize;
  /**
   * Used when there are no children: `decimal` ends in a point, 0 and
   * delete; `number` leaves the point out; `pin` adds letters under the
   * digits. Defaults to `decimal`.
   */
  layout?: KeypadLayout;
  /** Takes the bottom left slot of a ready-made layout, such as a Face ID key. */
  bottomLeft?: ReactNode;
  /** Hides delete in a ready-made layout, such as while nothing is typed. */
  showDelete?: boolean;
  /** Runs when delete is held in a ready-made layout, such as to clear. */
  onDeleteLongPress?: () => void;
  deleteLabel?: string;
  decimalLabel?: string;
  disabled?: boolean;
  disableAnimation?: boolean;
  /** Your own rows of keys, in place of a ready-made layout. */
  children?: ReactNode;
  className?: string;
};

/**
 * A number pad you can use as is or build key by key. It shares its
 * variant, size and `onKeyPress` with every `KeypadKey` inside, so custom
 * keys look and behave like the rest.
 */
export function Keypad({
  onKeyPress,
  variant = "plain",
  size = "md",
  layout = "decimal",
  bottomLeft,
  showDelete = true,
  onDeleteLongPress,
  deleteLabel,
  decimalLabel = "Decimal point",
  disabled = false,
  disableAnimation = false,
  children,
  className = "",
  ...props
}: KeypadProps) {
  const reduce = useReducedMotionPreference() || disableAnimation;
  const context = useMemo(
    () => ({ onKeyPress, variant, size, disabled, reduce }),
    [onKeyPress, variant, size, disabled, reduce],
  );
  const pin = layout === "pin";
  const circle = variant === "circle";

  const ready = (
    <>
      {DIGITS.map((row) => (
        <KeypadRow key={row[0]}>
          {row.map((d) => (
            <KeypadKey
              key={d}
              value={d}
              sublabel={pin ? LETTERS[Number(d)] : undefined}
            />
          ))}
        </KeypadRow>
      ))}
      <KeypadRow>
        {bottomLeft ??
          (layout === "decimal" ? (
            <KeypadKey value="." accessibilityLabel={decimalLabel} />
          ) : (
            <KeypadSpacer />
          ))}
        <KeypadKey value="0" />
        {showDelete ? (
          <KeypadDelete
            accessibilityLabel={deleteLabel}
            onLongPress={onDeleteLongPress}
          />
        ) : (
          <KeypadSpacer />
        )}
      </KeypadRow>
    </>
  );

  return (
    <KeypadContext.Provider value={context}>
      <View
        {...props}
        style={[circle ? { gap: size === "sm" ? 12 : 16 } : null, props.style]}
        className={className}
      >
        {children ?? ready}
      </View>
    </KeypadContext.Provider>
  );
}
