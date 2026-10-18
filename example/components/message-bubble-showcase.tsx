import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useResolveClassNames } from "uniwind";
import {
  MessageBubble,
  MessageBubbleCollapsible,
  MessageBubbleGroup,
  MessageBubbleText,
  type MessageBubbleVariant,
} from "../../src";
import { DemoSection, DemoStatus } from "./demo";
import { ArrowUpIcon } from "./icons";

const REPLIES = [
  "Ship it on Friday?",
  "Can you pull the latest numbers?",
  "Looks great, thanks!",
  "Let's keep the old copy for now.",
];

const SURFACES: { variant: MessageBubbleVariant; text: string }[] = [
  { variant: "soft", text: "Soft, the default for replies." },
  { variant: "tint", text: "Tint picks up the primary color." },
  { variant: "outline", text: "Outline sits on the page." },
  { variant: "danger", text: "Danger, for failed sends." },
];

const THREAD = [
  { id: "a", align: "start", text: "The build is green. Want me to ship it?" },
  {
    id: "b",
    align: "end",
    text: "Not yet, the copy changes are still in review.",
  },
  {
    id: "c",
    align: "start",
    text: "Got it. I'll hold the release until they land.",
  },
] as const;

export function MessageBubbleShowcase() {
  const [sent, setSent] = useState<{ id: number; text: string }[]>([]);
  const { color: background } = useResolveClassNames("text-on-primary");
  const send = () =>
    setSent((previous) => [
      ...previous,
      { id: Date.now(), text: REPLIES[previous.length % REPLIES.length] ?? "" },
    ]);
  const [note, setNote] = useState(
    "Swipe a bubble toward the middle, or long-press it.",
  );

  return (
    <>
      <DemoSection
        title="Animated surfaces"
        description="A sent bubble pops out of the corner on its side, and bubbles in a row join up. Send a few."
      >
        <MessageBubbleGroup spacing="default">
          {SURFACES.map((surface) => (
            <MessageBubble key={surface.variant} variant={surface.variant}>
              {surface.text}
            </MessageBubble>
          ))}
          <MessageBubble variant="solid" align="end">
            Solid, for your own messages.
          </MessageBubble>
          {sent.map((message) => (
            <MessageBubble
              key={message.id}
              variant="solid"
              align="end"
              animateIn
            >
              {message.text}
            </MessageBubble>
          ))}
        </MessageBubbleGroup>
        {/* A small composer: the next reply waits in the field. */}
        <View className="h-11 flex-row items-center gap-2 rounded-full border border-border bg-background pl-4 pr-1.5">
          <Text numberOfLines={1} className="flex-1 text-sm text-foreground">
            {REPLIES[sent.length % REPLIES.length]}
          </Text>
          {sent.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSent([])}
              hitSlop={8}
              className="px-2"
            >
              <Text className="text-xs font-medium text-muted">Clear</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={send}
            className="size-8 items-center justify-center rounded-full bg-primary active:opacity-80"
          >
            <ArrowUpIcon size={16} color={background} />
          </Pressable>
        </View>
      </DemoSection>
      <DemoSection
        title="Swipe to reply"
        description="Drag a bubble toward the middle until the arrow pops, then let go. A long press lifts it, ready for a menu."
      >
        <DemoStatus>{note}</DemoStatus>
        <MessageBubbleGroup spacing="default">
          {THREAD.map((message) => (
            <MessageBubble
              key={message.id}
              align={message.align}
              variant={message.align === "end" ? "solid" : "soft"}
              onReply={() => setNote(`Replying to “${message.text}”`)}
              onLongPress={() => setNote(`Long-pressed “${message.text}”`)}
              accessibilityLabel={message.text}
            >
              {message.text}
            </MessageBubble>
          ))}
        </MessageBubbleGroup>
      </DemoSection>
      <DemoSection
        title="Show more"
        description="Long replies clamp to four lines and spring open to their full height."
      >
        <MessageBubble>
          <MessageBubbleCollapsible collapsedLines={4}>
            <MessageBubbleText>
              Here's the plan for the launch. We'll freeze the release branch on
              Wednesday, run the full test suite overnight, and hand the build
              to QA on Thursday morning.
            </MessageBubbleText>
            <MessageBubbleText className="mt-2">
              If QA signs off by noon, the store submission goes out Thursday
              afternoon, which leaves Friday for review. The web release follows
              once the app is approved, so both land the same day.
            </MessageBubbleText>
            <MessageBubbleText className="mt-2">
              I'll post updates in the channel as each step finishes.
            </MessageBubbleText>
          </MessageBubbleCollapsible>
        </MessageBubble>
      </DemoSection>
    </>
  );
}
