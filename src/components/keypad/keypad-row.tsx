import { View, type ViewProps } from "react-native";
import { KEY_SIZES, useKeypad } from "./keypad-context";

export type KeypadRowProps = ViewProps & { className?: string };

/** A row of keys. Plain keys share its width; circle keys sit apart. */
export function KeypadRow({ className = "", style, ...props }: KeypadRowProps) {
  const { variant, size } = useKeypad();
  const gap = KEY_SIZES[variant][size].gap;
  return (
    <View
      {...props}
      style={[{ gap }, style]}
      className={`flex-row ${variant === "circle" ? "justify-center" : ""} ${className}`}
    />
  );
}
