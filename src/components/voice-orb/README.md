# Voice Orb

Native port of [beUI Voice Orb](https://beui.dev/components/agents/voice-orb): a grainy liquid sphere that moves with a voice.

```tsx
import { useSharedValue } from "react-native-reanimated";
import { VoiceOrb } from "./src";

const level = useSharedValue(0);
// Feed it your microphone level, 0 to 1, such as from expo-audio metering.

<VoiceOrb activity={level} accessibilityLabel="Listening" onPress={toggleListening} />
```

## Behavior

- `activity` is the voice level from 0 to 1, as a number or a Reanimated shared value. A shared value drives the orb from audio metering without re-rendering. It's smoothed on a fast, critically damped spring.
- Voice opens the folds, ripples the rim and speeds the flow up to 1.6×. The silhouette lifts 2 points, widens 4% and squashes 1.8% at full voice.
- `active={false}` freezes the surface exactly where it is. Time only advances while active, scaled by `speed`.
- `colors` are the base, highlight and shadow as `#RGB` or `#RRGGBB`. `size` defaults to 256 points.
- The surface is the web version's shader, ported to Skia and running on the GPU. Grain and edge softness match the web at up to 2× density.

## Better on a phone

The orb is often the talk button. `onPress` and `onLongPress` make it one: it squishes under your finger like something soft, then springs back.

## Accessibility

- With `accessibilityLabel`, it's an image, or a button when it has `onPress`. Without a label it's hidden from screen readers.
- Reduced motion, or `disableAnimation`, draws a still surface with no voice response.

The component never asks for the microphone; your app supplies the level.

Copy this directory, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `@shopify/react-native-skia`.
