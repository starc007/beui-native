# Text Animation

Native port of [beUI Text Animation](https://beui.dev/components/motion/text-animation): five primitives for text that arrives or changes.

```tsx
import {
  ChromaticTextReveal,
  TextCascade,
  TextReveal,
  TextScramble,
  TextShimmer,
} from "./src";

<TextReveal text="Motion in words." className="text-3xl font-semibold text-foreground" />
<ChromaticTextReveal prefix="Motion that feels" words={["natural.", "alive."]} />
<TextShimmer className="text-xl font-semibold">Thinking</TextShimmer>
<TextCascade text={status} />
<TextScramble text={codename} />
```

## TextReveal

Words (or characters with `split="char"`) rise into place one after another, 90 ms apart. Each rises on a soft spring (stiffness 140, damping 26, mass 1.2) and fades in over 700 ms. `yOffset` takes points or a percentage of the line height ("40%" by default). Lines wrap between words, never inside them. Pass an array for explicit lines. Change `key` to replay it.

## ChromaticTextReveal

A fixed `prefix` followed by a word revealed by a moving colour sweep. Behind the sweep the word is solid, inside a trail 14% of the word either side it takes the `colors` palette, and ahead of it the word is still invisible. After each 1200 ms sweep and an 800 ms pause, the next word arrives. The space reserved is the widest word's, so the sentence never reflows.

## TextShimmer

A highlight that sweeps across muted text every 2500 ms, for loading and thinking states. The colours come from the theme's muted and foreground tokens.

## TextCascade

The letter cascade from `StatefulButton` for standalone text. When `text` changes, the old letters roll up and away as the new ones spring in from below, left to right, and the width springs to fit.

## TextScramble

When `text` changes, every unresolved character cycles through random glyphs, settling left to right on the new text within 420–760 ms. The first text appears as is.

## Shared behavior

- `className` styles every glyph or word, such as `text-xl font-semibold text-foreground`.
- Each component is one accessible text element whose label is the final text.
- Reduced motion, or `disableAnimation`, shows text without movement. TextReveal fades, ChromaticTextReveal stays on the first word fully revealed, TextShimmer stays muted, TextCascade crossfades, and TextScramble swaps instantly.
- Durations are in milliseconds.

Native can't clip a gradient to text without extra libraries. The chromatic sweep and the shimmer therefore colour each character individually from the moving gradient, using the shared `GlyphRow` primitive. Scripts that need letter shaping, such as Arabic or Devanagari, are coloured as a whole instead, so their letters still join. TextCascade cascades only Latin text for the same reason. Native also has no cheap blur, so the web version's blur effects are left out. `whileInView` and `startOnView` aren't ported: animations start when mounted.

Copy this directory, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/cascade-text.tsx`, `primitives/glyph-row.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
