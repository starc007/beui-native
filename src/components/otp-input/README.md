# OTP Input

Native port of [beUI OTP Input](https://beui.dev/components/blocks/otp-input). A one-time-code field whose digits roll into their slots, with an error shake and a check that draws itself on success.

```tsx
import { OTPInput } from "./src";

<OTPInput
  label="Verification code"
  hint="We sent a code to your phone."
  errorMessage="Wrong code, try again."
  successMessage="Verified."
  value={code}
  status={status}
  onChangeText={setCode}
  onComplete={verify}
/>
```

- **Slots:** `length` slots (6 by default), 48 by 56 points each. Each new digit rolls up into its slot over 220 ms, and a deleted digit rolls out upward. `mask` shows dots instead of digits.
- **Caret:** the active slot shows a blinking caret and a stronger border. Slot borders fade between empty, filled, active, error and success colours.
- **Status:** `status="error"` shakes the slots and turns them red. `status="success"` turns them green and springs in a check that draws itself beside the slots. Each status message is announced to screen readers.
- **Input:** a transparent native `TextInput` covers the slots and owns focus, the number pad, paste and SMS autofill (`oneTimeCode` on iOS, `sms-otp` on Android). It only accepts digits. `onComplete` fires when the last slot fills.
- **State:** pass `value` with `onChangeText` to control it, or `defaultValue` to let it manage itself.
- **Keyboard:** the number pad follows the app's light or dark theme on iOS (override with `keyboardAppearance`). `blurOnComplete` dismisses the keyboard once the last slot fills.
- **Accessibility:** screen readers see one field named by `label` (or "One-time passcode"), with the current message as its hint. The drawn slots are hidden from them.
- **Reduced motion:** when the system asks for it, or `disableAnimation` is set, digits and colours change instantly, the caret stays solid, and nothing shakes.

Unlike the web version, editing always happens at the end of the code: backspace removes the last digit and typing appends. The web version lets you place the caret in a middle slot with a mouse or the arrow keys, which touch keyboards don't offer.

Copy this directory, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `hooks/use-shake.ts`, `primitives/drawn-path.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
