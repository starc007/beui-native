# Message

Native port of [beUI Message](https://beui.dev/components/agents/message): the row around chat bubbles, with avatars, metadata and a typing indicator.

```tsx
import {
  Message,
  MessageAvatar,
  MessageBubble,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
  MessageTyping,
} from "./src";

<MessageGroup spacing="default">
  <Message from="user" animateIn>
    <MessageAvatar>Y</MessageAvatar>
    <MessageContent>
      <MessageHeader>You · 9:41</MessageHeader>
      <MessageBubble variant="solid">Can you summarize the notes?</MessageBubble>
      <MessageFooter>Delivered</MessageFooter>
    </MessageContent>
  </Message>
  <Message from="assistant">
    <MessageAvatar>AI</MessageAvatar>
    <MessageContent>
      <MessageBubble>
        <MessageTyping />
      </MessageBubble>
    </MessageContent>
  </Message>
</MessageGroup>
```

## Parts

- `Message` sets the side: user rows sit on the trailing side with the avatar after the content, and bubbles inside follow.
- `MessageAvatar` is a 28 point circle for initials, an image or an icon. `placeholder` keeps the slot empty so grouped replies stay aligned.
- `MessageHeader` and `MessageFooter` are small muted lines above and below the bubbles.
- `MessageMarker` is a centered pill for dates and system notes.
- `MessageTyping` shows three dots that rise and fade in turn.
- `MessageGroup` stacks rows 6 points apart, or 16 with `spacing="default"`.

## Motion

`animateIn` rises the row 8 points out of its trailing bottom corner as it scales from 0.95, on a spring (stiffness 480, damping 32, mass 0.62), once on mount. Use it for messages the person sends. The typing dots each rise 2 points and brighten over a 1050 ms cycle, 140 ms apart.

## Accessibility

- The typing indicator is a progress bar named "Responding". Change it with `label`.
- Placeholder avatars are hidden from screen readers.
- Reduced motion, or `disableAnimation`, shows rows without the rise and holds the dots still.

Copy this directory and `components/message-bubble/` with its files, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
