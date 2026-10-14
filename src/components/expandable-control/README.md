# Expandable Control

Native port of [beUI Expandable Control](https://beui.dev/components/motion/expandable-control). A round icon button and a chip that spring open when pressed, revealing a label or a trailing action, and fold back on the next press.

```tsx
import { ExpandableButton, ExpandableChip } from "./src";

<ExpandableButton icon={BellIcon} label="Notifications" />

<ExpandableChip
  label="React"
  actionLabel="Remove React"
  onAction={() => removeTag("react")}
/>
```

## ExpandableButton

A 44-point round button with an icon that grows into a pill showing its label.

- `icon`: a component given `{ size, color }`, or an element. `label`: the revealed text, also its accessible name.
- `expanded` / `defaultExpanded` / `onExpandedChange`: controlled or uncontrolled. Control it to keep one button in a group open at a time.
- `onPress` runs first; call `event.preventDefault()` in it to keep the button from toggling.
- `disabled`, `disableAnimation`, `className`, `labelClassName`, plus Pressable props.

## ExpandableChip

A 40-point chip whose label, when pressed, makes room for a trailing action.

- `label`, `actionLabel` (the action's accessible name, such as "Remove React"), `onAction`.
- `actionIcon`: replaces the default X.
- `collapseOnAction`: folds the chip after the action runs. Defaults to true.
- `expanded` / `defaultExpanded` / `onExpandedChange`, `disabled`, `disableAnimation`, `className`, `labelClassName`.

## Motion

One spring drives each control: a 0 to 1 progress (stiffness 320, damping 22, mass 0.8), quicker than the web version's continuity spring, like a native control under a finger, with a hint of give at the end. The width, the revealed content's fade and 8-point slide, and the surface's tint all read from it, so folding is opening played backward, overshoot included, and a tap mid-motion reverses from wherever it is.

- The button grows by its label's measured width. As a fold overshoots past closed, its outline dips a few points narrower while the icon stays centered and full size.
- The chip's action slot opens as its label's trailing padding gives room back, and its X turns in a quarter turn as it appears.
- Open controls take a soft tint and a firmer outline, so they read as on at a glance.
- Pressing sinks either to 96% on beUI's press spring.

The web version blurs content as it appears; React Native has no cheap blur, so it fades and slides instead. With reduced motion, or `disableAnimation`, controls change at once and the press doesn't scale.

For haptics, call your haptics library from `onExpandedChange`, as the showcase does with expo-haptics. To animate a chip out of a list when its action removes it, wrap it in an `Animated.View` with an `exiting` animation and a `layout` transition, and pass `collapseOnAction={false}`.

## Accessibility

The button and the chip's label report whether they're expanded. The chip's action is hidden from screen readers and can't be pressed while the chip is folded.

Copy this directory, `primitives/drawn-path.tsx`, `primitives/render-icon.tsx`, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
