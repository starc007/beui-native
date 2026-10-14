# Animated Badge

Native port of [beUI Animated Badge](https://beui.dev/components/motion/animated-badge). A status pill whose icon and label roll when they change, with colors that blend and a width that springs to fit.

```tsx
import { AnimatedBadge } from "./src";

<AnimatedBadge status={synced ? "success" : "loading"} accessibilityLiveRegion="polite">
  {synced ? "Synced" : "Syncing"}
</AnimatedBadge>
```

## Props

- `status`: `neutral` (the default), `info`, `success`, `warning`, `danger` or `loading`. Each uses the semantic tokens, so badges follow the theme.
- `size`: `sm` (24 points tall) or `md` (32, the default).
- `children`: the label. Leave it out for an icon-only badge, and give that an `accessibilityLabel`.
- `icon`: replaces the status icon. A component given `{ size, color }`, or an element.
- `showIcon`: defaults to true.
- `pulse`: a slow breathing fill. On by default while loading.
- `contentKey`: rolls the label when it changes. Defaults to a string or number label, so a new label rolls on its own; pass one when the label is an element.
- `disableAnimation`, `className`, plus any View props.

The badge hugs its content. Give it a `self-*` class, such as `self-center`, to place it in a column.

## Motion

On a status or label change, the leaving icon and label slide up and fade over 140 ms on beUI's ease-out, while the next ones rise into place on the swap spring. Colors blend over 300 ms and the pill springs to its new width on the layout spring. The loading icon spins once a second and the pulse breathes every 1.6 seconds.

The web version also blurs content as it rolls; React Native has no cheap blur, so the roll fades instead.

With reduced motion, or `disableAnimation`, content swaps in place, colors change at once, and the spin and pulse stop.

## Accessibility

The badge reads as one piece of text: its label, or `accessibilityLabel`. Icons are hidden from screen readers. For a badge that changes while someone is on the screen, pass `accessibilityLiveRegion="polite"` on Android; on iOS, announce the change with `AccessibilityInfo.announceForAccessibility` if it matters.

Copy this directory, `primitives/drawn-path.tsx`, `primitives/render-icon.tsx`, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
