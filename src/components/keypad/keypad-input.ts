export type KeypadInputOptions = {
  /** Digits allowed after the decimal point. 0 turns the point off. Defaults to 2. */
  decimals?: number;
  /** The longest the value can get, point included. Defaults to 12. */
  maxLength?: number;
  /** The key that removes the last character. Defaults to "delete". */
  deleteKey?: string;
  /** The key for the decimal point. Defaults to ".". */
  decimalKey?: string;
};

/**
 * The value after a key press, for amount and number entry. Digits append
 * (a lone "0" is replaced), the point appears once ("0." when empty) and
 * respects `decimals`, delete removes the last character, and anything past
 * `maxLength` is ignored. Unknown keys leave the value as it is.
 */
export function applyKeypadKey(
  value: string,
  key: string,
  {
    decimals = 2,
    maxLength = 12,
    deleteKey = "delete",
    decimalKey = ".",
  }: KeypadInputOptions = {},
) {
  if (key === deleteKey) return value.slice(0, -1);
  if (key === decimalKey) {
    if (decimals === 0 || value.includes(".") || value.length >= maxLength) {
      return value;
    }
    return value ? `${value}.` : "0.";
  }
  if (!/^\d$/.test(key) || value.length >= maxLength) return value;
  const fraction = value.split(".")[1];
  if (fraction !== undefined && fraction.length >= decimals) return value;
  return value === "0" ? key : value + key;
}
