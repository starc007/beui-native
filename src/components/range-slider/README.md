# Range Slider

Native port of [beUI Range Slider](https://beui.dev/components/motion/range-slider). A stepped slider with tick dots and a bar thumb that glides between steps and stretches while held.

```tsx
import { RangeSlider } from "./src";

const [value, setValue] = useState(40);

<RangeSlider
  value={value}
  onValueChange={setValue}
  step={5}
  accessibilityLabel="Value"
/>
```

## Props

- `value` / `defaultValue` / `onValueChange`: controlled or uncontrolled. `onValueChange` fires once per step while dragging, so it's the place for a selection haptic.
- `onSlidingComplete`: the final value when a drag or tap lets go.
- `min`, `max`, `step`: default to 0, 100 and 1. When the step doesn't divide the range, the end of the track still reaches `max`.
- `showTicks`: a dot at each step. Defaults to true, and hides itself past 50 steps.
- `formatValueText`: what screen readers hear instead of the raw number, such as ``(v) => `${v}%` ``.
- `disabled`, `disableAnimation`, `className`.

## Touch

Drag or tap anywhere on the track; the thumb lands under your finger. Horizontal drags own the slider and vertical swipes go on to scroll the page, so it works inside a ScrollView.

## Motion

The thumb and fill follow beUI's glide spring, critically damped so they never rebound off an end. While held, the thumb stretches to 135% on a bouncy spring. With reduced motion, or `disableAnimation`, both move straight to the value and the thumb doesn't stretch.

## Accessibility

The track is one adjustable control (a `slider` on web) with its range, value and value text. VoiceOver and TalkBack swipe up and down to step it; on web, arrow keys step it, Page Up and Down move ten steps, and Home and End jump to the ends. Give it an `accessibilityLabel`.

Copy this directory, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
