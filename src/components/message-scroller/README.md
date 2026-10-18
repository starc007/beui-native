# Message Scroller

Native port of [beUI Message Scroller](https://beui.dev/components/agents/message-scroller): a conversation that keeps the newest message in view.

```tsx
import { MessageScroller } from "./src";

<MessageScroller busy={streaming} contentClassName="p-4">
  {messages}
</MessageScroller>
```

## Behavior

- While following, new content scrolls the conversation to the bottom.
- The moment you drag up past `followThreshold` (56 points), it stops following, so a streaming reply never pulls you away from what you're reading. Only your own scrolling changes this, never the component's.
- A "Jump to latest" pill springs up from the bottom while you're away from the end. Tapping it scrolls down and resumes following. Turn it off with `showJump={false}`.
- `onFollowChange` reports each change, and the ref's `scrollToEnd()` jumps to the latest message from your own controls.
- It's a `ScrollView`, so its props pass through. Inside another vertical scroll view on Android, set `nestedScrollEnabled`.

The web version's preview rail depends on hover, so it isn't ported. The jump pill takes its place on touch screens.

## Accessibility

- The scroll view is named "Conversation". Change it with `label`.
- The content is a polite live region on Android and is marked busy while `busy` is set.
- Reduced motion, or `disableAnimation`, jumps instead of scrolling smoothly and fades the pill in place.

Copy this directory, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icon.
