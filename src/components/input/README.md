# Input

Native port of [beUI Input](https://beui.dev/components/motion/input). A text field with a label, leading and trailing icons, an error shake, and a check that draws itself on success.

```tsx
import { Input } from "./src";

<Input
  label="Email"
  leftIcon={Mail}
  value={email}
  onChangeText={setEmail}
  error={valid ? undefined : "Enter a valid email address."}
  reserveErrorLine
/>
<Input label="Search" leftIcon={Search} success={found} />
<Input label="Password" secureTextEntry rightIcon={<ToggleButton />} />
```

- **Field:** a 44-point, fully rounded field. Its border fades between idle, focused and error colours over 200 ms. Focus and error also show a 2-point ring, like the web's `ring-2`.
- **Error:** a truthy `error` shakes the field (6, 4 and 2 points over 450 ms) and turns it red. A string `error` also shows a message that fades and drops in, and is announced to screen readers. `reserveErrorLine` keeps one line of space so content below doesn't jump.
- **Success:** `success` draws a check at the trailing edge in place of `rightIcon`.
- **Icons:** `leftIcon` and `rightIcon` take a component given `{ size, color }` (such as a lucide icon) or a prebuilt element. A trailing control, such as a show-password button, sits in a 44-point square so it stays easy to tap.
- **State:** pass `value` with `onChangeText` to control it, or `defaultValue` to let it manage itself. Every other `TextInput` prop passes through, and `ref` reaches the `TextInput`.
- **Accessibility:** the label is the field's spoken name, and pressing the label focuses the field. The error message is read as the hint and reported as invalid.
- **Reduced motion:** when the system asks for it, or `disableAnimation` is set, colours change instantly, nothing shakes, and the check appears fully drawn.

`classNames` styles the root, label, field, input and error message individually.

Copy this directory, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `hooks/use-shake.ts`, `primitives/drawn-path.tsx`, `primitives/render-icon.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
