# Message Bubble

Native port of [beUI Message Bubble](https://beui.dev/components/agents/message-bubble): chat bubbles in six surfaces.

```tsx
import { MessageBubble, MessageBubbleCollapsible, MessageBubbleGroup } from "./src";

<MessageBubbleGroup spacing="default">
  <MessageBubble variant="solid" align="end" animateIn>
    Ship it on Friday?
  </MessageBubble>
  <MessageBubble>
    <MessageBubbleCollapsible collapsedLines={4}>{longReply}</MessageBubbleCollapsible>
  </MessageBubble>
</MessageBubbleGroup>
```

## Surfaces

`variant` is `soft` (the default), `solid`, `tint`, `outline`, `ghost` or `danger`. A bubble is at most 82% of the row wide and sits on its `align` side, which defaults to the side of the surrounding `Message`. Plain strings take the bubble's text color; use `MessageBubbleText` for styled runs. `ghost` drops the surface and padding, for long assistant replies.

## Corners and runs

Bubbles have chat corners: the bottom corner on the sender's side tightens into a tail hint. Inside `MessageBubbleGroup`, consecutive bubbles from the same side form a run. They sit 2 points apart, and every bubble after the first tightens its top corner on that side too, so the run reads as one voice. Runs from different sides sit 6 points apart, or 12 with `spacing="default"`. The group works out each bubble's place for you; set `position` (`single`, `first`, `middle` or `last`) to choose it yourself.

## Motion

- `animateIn` pops the surface out of the bottom corner on the bubble's side once, on mount: it scales from 0.92 on a spring with one small overshoot (stiffness 520, damping 27, mass 0.52) and fades in over 120 ms, and the text follows 40 ms later.
- `onPress` or `onLongPress` makes the bubble a button that presses to 0.98.
- `MessageBubbleCollapsible` clamps its content to `collapsedLines` lines with a soft edge, and springs to its full height when opened. The toggle only appears when the content is taller than the clamp.

## Better on a phone

- `onReply` lets you swipe a bubble toward the middle of the screen to reply, as in Messages and WhatsApp. The bubble follows your finger and a reply arrow fades in; past 56 points the arrow pops and the drag resists, and letting go replies. The bubble springs back either way. Screen readers get a "Reply" action instead.
- `onLongPress` lifts the bubble with a small overshoot before it fires, so a context menu opens from a bubble that responded.

## Accessibility

- A tappable bubble is a button; give it an `accessibilityLabel` when its text alone doesn't say what tapping does.
- The show more toggle reports its expanded state.
- Reduced motion, or `disableAnimation`, shows bubbles without the pop and opens the clamp instantly.

Copy this directory, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/fade-edge.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icons and Gesture Handler for swipe to reply.
