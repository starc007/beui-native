import { View } from "react-native";
import { KEY_SIZES, useKeypad } from "./keypad-context";

/** An empty slot that holds a key's place, such as left of 0 on a pin pad. */
export function KeypadSpacer() {
  const { variant, size } = useKeypad();
  const { height } = KEY_SIZES[variant][size];
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      style={
        variant === "circle" ? { width: height, height } : { flex: 1, height }
      }
    />
  );
}
