# Streaming Response

Native port of [beUI Streaming Response](https://beui.dev/components/agents/streaming-response): an assistant reply that streams in and then offers actions.

```tsx
import * as Clipboard from "expo-clipboard";
import { StreamingResponse } from "./src";

<StreamingResponse
  status={done ? "complete" : "streaming"}
  onCopy={() => Clipboard.setStringAsync(text)}
  onRetry={retry}
  onFeedbackChange={(feedback) => rate(feedback)}
>
  {text}
</StreamingResponse>
```

## Behavior

- Pass the text as it arrives, or your Markdown renderer's output. Plain strings, or an array of paragraphs, are styled for you; change their style with `textClassName`.
- Once `status` isn't `streaming`, the actions rise in beneath the reply: copy when you pass `onCopy`, retry when you pass `onRetry`, and helpful and not helpful once `complete` when you pass `onFeedbackChange`. Tapping the chosen rating again clears it.
- Copying swaps the icon to a check for 1600 ms. Copy with whatever clipboard library your app uses; the component doesn't depend on one.
- Control the rating with `feedback`, or leave it uncontrolled with `defaultFeedback`.

Sources from the web version arrive with the Citations component.

## Motion

The action row fades and rises 4 points over 220 ms. Buttons press to 0.9, and the copy check springs in from below.

## Accessibility

- The reply is a polite live region on Android while streaming. Set `announce={false}` inside a conversation that's already announced, such as `MessageScroller`.
- It's marked busy while streaming.
- Ratings report whether they're selected.
- Reduced motion, or `disableAnimation`, fades the actions in place.

Copy this directory, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icons.
