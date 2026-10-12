# Swipeable List

List rows that swipe left or right to reveal actions, built for touch first: actions stretch with your finger, and a full swipe runs the outermost action as the row slides away. It started as a port of [beUI Swipeable List](https://beui.dev/components/blocks/swipeable-list) and now goes further than the web version.

```tsx
import { SwipeableList } from "./src";

<SwipeableList
  items={[
    {
      id: "brief",
      title: "Launch brief",
      description: "Finalize the announcement copy",
      meta: "9:41",
      leftActions: [
        { id: "done", label: "Done", icon: Check, tone: "success" },
        { id: "pin", label: "Pin", icon: Pin, tone: "primary" },
      ],
      rightActions: [
        { id: "later", label: "Later", icon: Clock, tone: "warning" },
        { id: "trash", label: "Trash", icon: Trash, tone: "danger" },
      ],
    },
  ]}
  onAction={({ item, action }) => {
    if (action.id === "trash") remove(item.id);
  }}
  onSwipeThreshold={({ armed }) => armed && Haptics.impactAsync()}
  onItemPress={(item) => open(item)}
/>
```

## Gestures

- **Swipe:** each row follows a Gesture Handler pan. A horizontal drag claims the row, and a vertical drag leaves the surrounding scroll view scrolling.
- **Stretching actions:** as you drag, the revealed space is shared evenly between that side's actions. Each action is a filled panel tinted by `tone` (`neutral`, `primary`, `success`, `warning` or `danger`), and its icon and label fade and scale in once there is room for them.
- **Resting open:** releasing past 40% of a side's actions (or flicking faster than 600 points per second) rests the row open at `actionWidth` per action (72 by default). An open row closes below 60%, on a flick back, or on a tap.
- **Full swipe:** keep dragging past the resting actions (by 64 points, and at least 55% of the row) and the outermost action springs out to fill the whole revealed space, while the others fold away. Releasing slides the row off screen and runs that action. Drag back before releasing and it springs back to normal. The outermost action is the first in `leftActions` and the last in `rightActions`. Set `fullSwipe={false}` to turn this off.
- **Resistance:** past the furthest point a side allows, the row moves less the further you pull, like iOS rubber-banding.
- **One open row:** starting a swipe on another row closes the open one.

## Removal

When an action removes its item from `items`, the row collapses its height and spacing while it fades, and the rows below glide up on a spring. After a full swipe the row is already off screen, so it simply folds away. If a fully swiped action does not remove its item, the row returns to rest. Items added later fade in; items present on first render appear in place.

## Callbacks

- `onAction({ item, action, side, fullSwipe })` runs for tapped actions, full swipes and accessibility actions. `fullSwipe` tells them apart.
- `onSwipeThreshold({ item, side, armed })` fires as a drag crosses the full-swipe point in either direction, the moment to play a haptic. The component itself has no haptics dependency. The example app calls `expo-haptics` here.
- `onItemPress(item)` runs when a closed row is tapped, with a soft pressed highlight.

## Other details

- **State:** pass `value` with `onValueChange` to control which row is open, or `defaultValue` to let it manage itself.
- **Content:** rows show `leading`, `title`, `description` and `meta` by default. Use `content` on an item, or `renderItem` for the whole list, to supply your own.
- **Accessibility:** each row is one element named by its title, description and meta. Screen readers can't swipe, so every action is also an accessibility action on the row (VoiceOver's rotor, or TalkBack's actions menu), along with "activate" when `onItemPress` is set. Action buttons stay hidden until their side opens.
- **Reduced motion:** when the system asks for it, or `disableAnimation` is set, rows snap without springing and removals happen without the collapse.
- **Web:** gestures and full swipes work. React Native Web doesn't run custom exit animations, so removed rows disappear without collapsing.

The list renders every row in a plain View, which suits inboxes and queues of tens of rows. Very long lists would need a virtualized variant built on `FlatList`.

Copy this directory, `hooks/use-reduced-motion.ts`, `primitives/render-icon.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. The host app needs Gesture Handler with a `GestureHandlerRootView` at its root, which the example app already has.
