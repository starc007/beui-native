# Slide Button

A track you drag a thumb across to confirm something you shouldn't do by accident, like sending money or deleting an account. The fill grows behind the thumb and the label fades as it goes. Let go early and it eases back; past the threshold it eases to the end and confirms. Drive `state` and the thumb spins while you work, then draws a check.

```tsx
import { SlideButton, type SlideButtonState } from "./src";

const [state, setState] = useState<SlideButtonState>("idle");

<SlideButton
  label="Slide to send"
  loadingLabel="Sending"
  successLabel="Sent"
  state={state}
  onSlideComplete={async () => {
    setState("loading");
    try {
      await send();
      setState("success");
    } catch {
      setState("error");
    }
  }}
  onThresholdChange={(past) => past && Haptics.selectionAsync()}
/>
```

## Props

- `label`: the text on the track. `loadingLabel` and `successLabel` are what screen readers hear in those states.
- `state`: `idle`, `loading`, `success` or `error`. `loading` and `success` hold the thumb at the end; `idle` and `error` glide it back to the start. The component doesn't change `state` itself, so you decide when it resets.
- `onSlideComplete()`: runs once the thumb is let go past `threshold`.
- `onThresholdChange(past)`: runs each time the thumb crosses the threshold, for a haptic tick.
- `threshold`: the share of the track that commits. Defaults to 0.85.
- `size`: `md` (52-point track) or `lg` (60, the default).
- `icon`, `successIcon`: replace the arrow and the drawn check. Each is a component given `{ size, color }`, such as a lucide icon, or a prebuilt element.
- `disabled`, `disableAnimation`, `className`, and View props.

## Motion

- **Drag:** the thumb follows the finger and the fill grows behind it. The label fades out by about 60% of the way.
- **Release:** short of the threshold, the thumb eases back over 260 ms with ease-out. Past it, it eases to the end over the same curve.
- **Loading:** the library's spinner turns in the thumb, centered.
- **Success:** a check draws in over 360 ms.
- **Error or reset:** the thumb glides back to the start, mirroring the way it went.
- **RTL:** the thumb starts at the leading edge and slides toward the trailing one, and the arrow flips.
- With reduced motion, or `disableAnimation`, the thumb jumps instead of gliding and the check appears drawn.

## Accessibility

The track is one button named by `label`, or by `loadingLabel` and `successLabel` in those states. It reports busy while loading and disabled while locked. VoiceOver and TalkBack confirm with a double tap through the activate action, so nobody has to drag. Horizontal drags own the thumb and vertical ones go on to scroll the page.

Copy this directory, the Loader component, `primitives/drawn-path.tsx`, `primitives/render-icon.tsx`, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. The arrow needs `react-native-svg`.
