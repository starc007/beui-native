# Keypad

A number pad for amounts, passcodes and anything else you type with digits. Use a ready-made layout as is, or build it key by key: every key inside shares the pad's look and its `onKeyPress`, so your own keys fit right in.

```tsx
import { applyKeypadKey, Keypad, KeypadDelete, KeypadKey, KeypadRow } from "./src";

const [amount, setAmount] = useState("");

// Ready-made: digits, then a point, 0 and delete.
<Keypad
  onKeyPress={(key) => setAmount((a) => applyKeypadKey(a, key, { decimals: 2 }))}
  onDeleteLongPress={() => setAmount("")}
/>

// A passcode pad with letters under the digits.
<Keypad variant="circle" layout="pin" showDelete={code.length > 0} onKeyPress={onKey} />

// Built key by key.
<Keypad onKeyPress={onKey}>
  <KeypadRow>
    <KeypadKey value="1" />
    <KeypadKey value="2" />
    <KeypadKey value="3" />
  </KeypadRow>
  <KeypadRow>
    <KeypadKey value="00" accessibilityLabel="Double zero" />
    <KeypadKey value="0" />
    <KeypadDelete onLongPress={clear} />
  </KeypadRow>
</Keypad>
```

## Parts

- **`Keypad`**: the pad. `onKeyPress(key)` gets each key's value. `variant` is `plain` (flat keys, the default) or `circle` (round passcode keys), and `size` is `sm` or `md`. Without children it draws a `layout`: `decimal` (a point, 0 and delete in the bottom row), `number` (no point) or `pin` (letters under the digits, no point). For those, `bottomLeft` takes the bottom left slot (a Face ID key, say), `showDelete` hides delete, `onDeleteLongPress` runs when delete is held, and `deleteLabel` and `decimalLabel` name those keys. Also `disabled`, `disableAnimation` and `className`.
- **`KeypadRow`**: a row of keys. Plain keys share its width; circle keys sit apart, centered.
- **`KeypadKey`**: one key. `value` goes to `onKeyPress`. `children` replaces the label (an icon, or a word in your own style), `sublabel` adds small text under it, and `onPress` runs instead of `onKeyPress`. It takes Pressable's props, such as `onLongPress` and `disabled`.
- **`KeypadDelete`**: a key with a backspace mark that sends `delete`. Change it with `value`, `iconSize` or `children`.
- **`KeypadSpacer`**: an empty slot that holds a key's place.
- **`applyKeypadKey(value, key, options)`**: the next value for amount entry. Digits append (a lone 0 is replaced), the point appears once (as "0." when empty), delete removes the last character, and nothing goes past `maxLength` (12) or past `decimals` (2) after the point. `deleteKey` and `decimalKey` rename the special keys.

## Motion

- **Plain:** a soft rounded backdrop lights in 60 ms when a key goes down and fades over 220 ms after it comes up, so quick taps still show.
- **Circle:** the key sinks to 92% on beUI's press spring while its fill brightens, and springs back on release.
- With reduced motion, or `disableAnimation`, keys light and dim without fading or sinking.

## Accessibility

Each key is a keyboard key named by its value, or by `accessibilityLabel` when the value isn't readable (delete reads "Delete", the point "Decimal point"). Disabled keys report it and dim to 40%. Keys are at least 48 points tall. Announce what's being typed from your own display, as the showcase does with a polite live region.

Copy this directory, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. The delete mark needs `react-native-svg`.
