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

Pass `sources` to show a stack of favicons and a count beside the actions; tapping it folds open the source list from Citations.

## Motion

The action row fades and rises 4 points over 220 ms. Buttons press to 0.9. Copying hands off cleanly: the copy icon slips down 3 points and fades in 110 ms, then the check draws itself on, left to right, over 260 ms. The two never overlap, and nothing is scaled, so the icons stay sharp throughout.

## Better on a phone

Reply text is selectable, so a long press brings up the system menu to copy a sentence or look up a word, not just the whole reply.

## Accessibility

- The reply is a polite live region on Android while streaming. Set `announce={false}` inside a conversation that's already announced, such as `MessageScroller`.
- It's marked busy while streaming.
- Ratings report whether they're selected.
- Reduced motion, or `disableAnimation`, fades the actions in place.

Copy this directory, `components/citations/`, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/disclosure.tsx`, `primitives/rise-in.tsx`, `primitives/overlay.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icons. Its overlay uses `FullWindowOverlay` from `react-native-screens` on iOS, so it covers native tab bars.
