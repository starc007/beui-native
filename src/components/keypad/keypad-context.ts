import { createContext, useContext } from "react";

export type KeypadVariant = "plain" | "circle";
export type KeypadSize = "sm" | "md";

export type KeypadContextValue = {
  onKeyPress?: (key: string) => void;
  variant: KeypadVariant;
  size: KeypadSize;
  disabled: boolean;
  reduce: boolean;
};

export const KeypadContext = createContext<KeypadContextValue | null>(null);

export function useKeypad() {
  const context = useContext(KeypadContext);
  if (!context) throw new Error("Keypad parts must be inside <Keypad>.");
  return context;
}

/** Each variant's key size: plain keys are rows, circle keys are round. */
export const KEY_SIZES: Record<
  KeypadVariant,
  Record<KeypadSize, { height: number; label: string; gap: number }>
> = {
  plain: {
    sm: { height: 48, label: "text-xl", gap: 0 },
    md: { height: 56, label: "text-2xl", gap: 0 },
  },
  circle: {
    sm: { height: 64, label: "text-2xl", gap: 20 },
    md: { height: 76, label: "text-3xl", gap: 24 },
  },
};
