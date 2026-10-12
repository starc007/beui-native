# Number Animation

Native port of [beUI Number Animation](https://beui.dev/components/motion/number): two primitives for numbers that change.

```tsx
import { AnimatedNumber, NumberTicker } from "./src";

<NumberTicker value={users} locale className="text-3xl font-semibold text-foreground" />
<AnimatedNumber value={revenue} format={(n) => `$${Math.round(n).toLocaleString()}`} />
```

## NumberTicker

Each digit sits in a 0–9 column and rolls to its new value over 900 ms on beUI's ease-out curve. On the first appearance, digits roll up from 0 one after another, 40 ms apart. Later updates roll every changed digit at once, because a stagger on live data reads as lag. Columns belong to a place value (ones, tens, hundreds), so a growing number adds columns on the left without replaying the others. Supports `pad`, `prefix`, `suffix`, `locale` grouping and a custom `format`.

## AnimatedNumber

Counts from the previous value (0 at first) to `value` over 1200 ms on the ease-out curve, formatting every frame with `format`. An interrupted count continues from where it is. Screen readers get the final value, never the in-between frames.

## Shared behavior

- `className` styles every glyph, such as `text-3xl font-semibold text-foreground`. Digits are tabular, and their roll height is measured from a "0" in that style, so it follows font size and text scaling.
- Each component is one accessible text element whose label is the full final value.
- Reduced motion, or `disableAnimation`, shows the final value without rolling or counting.
- Durations are in milliseconds. The web version's `startOnView` and `blur` options aren't ported: these start when mounted, and native has no cheap blur.

Copy this directory, `hooks/use-reduced-motion.ts` and `styles/motion.ts`.
