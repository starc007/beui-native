import { useEffect, useState } from "react";
import {
  Button,
  Message,
  MessageAvatar,
  MessageBubble,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
  MessageMarker,
  MessageTyping,
} from "../../src";
import { DemoSection } from "./demo";

/** Remounted by Replay, so the conversation plays again from the start. */
function Conversation() {
  const [stage, setStage] = useState(0);

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
          <MessageHeader>You · 9:41</MessageHeader>
          <MessageBubble variant="solid">
            Can you summarize yesterday's release notes?
          </MessageBubble>
          <MessageFooter>Delivered</MessageFooter>
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
          </MessageContent>
        </Message>
      ) : null}
    </MessageGroup>
  );
}

export function MessageShowcase() {
  const [run, setRun] = useState(0);

  return (
    <DemoSection
      title="Conversation"
      description="Your message rises out of its corner, the assistant types, and grouped replies keep their avatar slot."
    >
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
