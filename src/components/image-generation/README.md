# Image Generation

Native port of [beUI Image Generation](https://beui.dev/components/agents/image-generation): an image coming into being.

```tsx
import { Image } from "react-native";
import { ImageGeneration } from "./src";

<ImageGeneration status={status} prompt="a quiet mountain landscape at sunset">
  <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
</ImageGeneration>
```

## Behavior

- `status` moves through `queued`, `generating`, `refining` and `complete`, or `error`. You drive it.
- While active, a lattice of dots fills the frame, drawn with Skia. A soft lens wanders across it: dots inside grow, brighten and push outward.
- At `refining` the finished media shows through at 62% under the fading dots. At `complete` it settles into full view and the dots dissolve. The media stays mounted throughout, so nothing shifts.
- The frame reserves `aspectRatio` (1 by default). `size="compact"` caps it at 208 points wide; `"fluid"` fills.
- The status rolls along underneath with a turning glyph, and the `prompt` sits under it in quotes. After an error, `onRetry` adds "Try again".

## Better on a phone

- The web version's lens follows a mouse pointer and is switched off for touch. Here it follows your finger: drag across the placeholder and the lens tracks you, swelling under your touch, then wanders off again when you let go. Turn it off with `interactive={false}`.
- `onLongPress` on the finished image lifts it slightly before firing, ready for a save or share sheet.
- The lens eases at the same speed on 60 Hz and 120 Hz screens.

## Accessibility

- The frame is an image named by `label`, or the status and prompt. The status line is a polite live region, and the frame is marked busy while active.
- Reduced motion, or `disableAnimation`, draws one still frame of dots with the lens centered, and swaps statuses without movement.

Copy this directory, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/roll-text.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `@shopify/react-native-skia`, `react-native-svg` and Gesture Handler.
