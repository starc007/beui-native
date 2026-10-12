# Bouncy Accordion

Native port of [beUI Bouncy Accordion](https://beui.dev/components/motion/bouncy-accordion). A single-open accordion for FAQs and settings: rows sit together in one rounded stack, and the open row springs apart into its own group while its content bounces open.

```tsx
import { BouncyAccordion } from "./src";

<BouncyAccordion
  items={[
    { id: "expo", title: "Does it work in Expo Go?", description: "Yes." },
    { id: "icons", title: "Which icons?", description: "Any library.", icon: Search },
  ]}
  defaultValue="expo"
/>
```

- **Grouping:** closed rows join into one stack with 28-point outer corners. Opening a row moves it 12 points away from its neighbors, and the corners on either side of each gap spring round, so the open row becomes its own card.
- **Motion:** the gap, corners and content height spring with a bounce: 550 ms at damping ratio 0.62 for the row, 580 ms at 0.68 to open, and 520 ms at 0.55 to close. That's livelier than the web version on close, where the bounce is mostly clipped once the height reaches zero. The chevron flips on its own spring and the content fades in over 180 ms. A row that starts open appears in place without animating.
- **Closing bounce:** a height can't go below zero, so a closing row's overshoot becomes a small negative bottom margin. The rows below travel up to 14 points past rest and spring back. That overlap only covers the closing row's empty bottom padding, in the same colour as the stack it's rejoining, so nothing visibly overlaps.
- **Content:** `description` can be a string, which gets the default muted text style, or any element. Its height is measured at its natural size, so long answers and larger text open fully.
- **State:** pass `value` with `onValueChange` to control the open row, or `defaultValue` to let it manage itself. `collapsible={false}` keeps one row always open.
- **Rows:** each row is at least 54 points tall, with an optional leading `icon` (a component given `{ size, color }`, or an element) and a soft pressed highlight. `disabled` dims a row and ignores presses.
- **Accessibility:** each row header is a button reporting its expanded and disabled states. Closed content is hidden from screen readers.
- **Reduced motion:** when the system asks for it, or `disableAnimation` is set, rows open and close instantly.

`classNames` styles the root, rows, headers, titles and descriptions individually.

Copy this directory, `hooks/use-reduced-motion.ts`, `primitives/drawn-path.tsx`, `primitives/render-icon.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
