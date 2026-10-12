# Swipeable List

Native port of [beUI Swipeable List](https://beui.dev/components/blocks/swipeable-list). List rows that swipe left or right to reveal action buttons.

```tsx
import { SwipeableList } from "./src";

<SwipeableList
  items={[
    {
      id: "brief",
      title: "Launch brief",
      description: "Finalize the announcement copy",
      meta: "9:41",
      leftActions: [{ id: "done", label: "Done", icon: Check, tone: "success" }],
      rightActions: [{ id: "trash", label: "Trash", icon: Trash, tone: "danger" }],
    },
  ]}
  onAction={({ item, action }) => handle(item, action)}
/>
```

- **Gesture:** each row follows a Gesture Handler pan. A horizontal drag claims the row, while a vertical drag fails the pan so the surrounding scroll view keeps scrolling. Past the last action, the row moves at 4% of your finger's speed, like the web version's drag elastic.
- **Release:** a side opens once the row passes 46% of its actions' width (at least `revealThreshold`, 34 points), or on a flick faster than 720 points per second. An open row closes below 72% or on a flick back faster than 320. The row settles on the web version's spring (stiffness 560, damping 48, mass 0.82), carrying the release velocity up to 1500.
- **One open row:** starting a swipe on another row closes the open one. Tapping an open row closes it, as in native mail lists.
- **Actions:** `leftActions` show when swiping right, `rightActions` when swiping left. Each action is `actionWidth` points wide (56 by default), with an icon tinted by `tone`: `neutral`, `primary`, `success`, `warning` or `danger`. `closeOnAction` (true by default) closes the row after an action.
- **Content:** rows show `leading`, `title`, `description` and `meta` by default. Use `content` on an item, or `renderItem` for the whole list, to supply your own.
- **State:** pass `value` with `onValueChange` to control which row is open, or `defaultValue` to let it manage itself.
- **Accessibility:** each row is one element named by its title, description and meta. Screen readers can't swipe, so every action is also an accessibility action on the row (VoiceOver's rotor, or TalkBack's actions menu). Hidden action buttons stay out of reach until their side opens.
- **Reduced motion:** when the system asks for it, or `disableAnimation` is set, rows snap open and closed without springing.

The list renders every row in a plain View, which suits inboxes and queues of tens of rows. Very long lists would need a virtualized variant built on `FlatList`.

Copy this directory, `hooks/use-reduced-motion.ts`, `primitives/render-icon.tsx`, and the semantic tokens in `styles/theme.css`. The host app needs Gesture Handler with a `GestureHandlerRootView` at its root, which the example app already has.
