import { useEffect, useState } from "react";
import {
  Button,
  Message,
  MessageAvatar,
  MessageBubble,
  MessageContent,
  MessageGroup,
  MessageHeader,
  MessageMarker,
  MessageStatus,
  MessageTyping,
} from "../../src";
import { DemoSection } from "./demo";

/** Remounted by Replay, so the conversation plays again from the start. */
function Conversation() {
  const [stage, setStage] = useState(0);
  // Your message moves from sending to read as the assistant picks it up.
  const delivery = stage === 0 ? "sending" : stage === 1 ? "delivered" : "read";

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 400),
      setTimeout(() => setStage(2), 1500),
      setTimeout(() => setStage(3), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <MessageGroup spacing="default">
      <MessageMarker>Today</MessageMarker>
      <Message from="user" animateIn>
        <MessageAvatar>Y</MessageAvatar>
        <MessageContent>
          <MessageHeader>You</MessageHeader>
          <MessageBubble variant="solid">
            Can you summarize yesterday's release notes?
          </MessageBubble>
          <MessageStatus time="9:41" delivery={delivery} />
        </MessageContent>
      </Message>
      {stage === 1 ? (
        <Message from="assistant" animateIn>
          <MessageAvatar>AI</MessageAvatar>
          <MessageContent>
            <MessageBubble>
              <MessageTyping />
            </MessageBubble>
          </MessageContent>
        </Message>
      ) : null}
      {stage >= 2 ? (
        <Message from="assistant" animateIn>
          <MessageAvatar>AI</MessageAvatar>
          <MessageContent>
            <MessageHeader>Assistant</MessageHeader>
            <MessageBubble>
              Three changes shipped: faster sync, a new export menu, and a fix
              for duplicate notifications.
            </MessageBubble>
          </MessageContent>
        </Message>
      ) : null}
      {stage >= 3 ? (
        <Message from="assistant" animateIn>
          <MessageAvatar placeholder />
          <MessageContent>
            <MessageBubble>Want the full changelog too?</MessageBubble>
            <MessageStatus time="9:42" />
          </MessageContent>
        </Message>
      ) : null}
    </MessageGroup>
  );
}

export function MessageShowcase() {
  const [run, setRun] = useState(0);

  return (
    <DemoSection title="Conversation">
      <Conversation key={run} />
      <Button
        className="self-center"
        size="sm"
        variant="ghost"
        onPress={() => setRun((n) => n + 1)}
      >
        Replay
      </Button>
    </DemoSection>
  );
}
