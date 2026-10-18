import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import {
  Message,
  MessageBubble,
  MessageBubbleGroup,
  MessageContent,
  type MessageDelivery,
  MessageGroup,
  MessageScroller,
  MessageStatus,
  type PromptAction,
  PromptInput,
  ThinkingShimmer,
} from "../../src";
import { DemoSection, DemoStatus } from "./demo";
import { AttachIcon, ImageIcon } from "./icons";

type From = "user" | "assistant";
type Entry = {
  id: number;
  from: From;
  text: string;
  time: string;
  fresh?: boolean;
};

const SEED: [From, string][] = [
  ["user", "What's left before the launch?"],
  [
    "assistant",
    "Three things: the store screenshots, the release notes, and a last pass on onboarding.",
  ],
  ["user", "Screenshots are done."],
  ["user", "Can you draft the notes?"],
  ["assistant", "Sure. Do you want them short, or with a line per fix?"],
  ["user", "Short, please."],
  [
    "assistant",
    "Faster sync, a new export menu, and fewer duplicate notifications.",
  ],
  ["assistant", "Want me to post them to the release channel too?"],
  ["user", "Not yet. What about onboarding?"],
  [
    "assistant",
    "The second screen still says “workspace”. I'd change it to “project” to match the app.",
  ],
];

const ACTIONS: PromptAction[] = [
  { value: "photos", label: "Add photos", icon: ImageIcon },
  { value: "files", label: "Add files", icon: AttachIcon },
];

const REPLY =
  "Done. I renamed every “workspace” on the onboarding screens to “project”, updated the illustration captions, and checked the empty states too. Scroll up while this streams: the conversation stops following you, and the pill brings you back. Back at the bottom, it follows the reply again as it grows.";

const now = () => {
  const date = new Date();
  return `${date.getHours() % 12 || 12}:${String(date.getMinutes()).padStart(2, "0")}`;
};

/** Consecutive entries from one side, shown as one row of joined bubbles. */
function runs(entries: Entry[]) {
  const grouped: Entry[][] = [];
  for (const entry of entries) {
    const last = grouped[grouped.length - 1];
    if (last?.[0]?.from === entry.from) last.push(entry);
    else grouped.push([entry]);
  }
  return grouped;
}

export function MessageScrollerShowcase() {
  const [entries, setEntries] = useState<Entry[]>(() =>
    SEED.map(([from, text], index) => ({
      id: index,
      from,
      text,
      time: `9:${30 + index}`,
    })),
  );
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const [thinking, setThinking] = useState(false);
  const [following, setFollowing] = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const stopAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const send = (text: string) => {
    stopAll();
    setStreamingId(null);
    setEntries((previous) => [
      ...previous,
      { id: Date.now(), from: "user", text, time: now(), fresh: true },
    ]);
    setThinking(true);
    timers.current.push(
      setTimeout(() => {
        setThinking(false);
        // The reply streams into one bubble that stays put when it finishes.
        const id = Date.now();
        setStreamingId(id);
        setEntries((previous) => [
          ...previous,
          { id, from: "assistant", text: "", time: now() },
        ]);
        const startedAt = Date.now();
        const tick = () => {
          const length = Math.floor(((Date.now() - startedAt) / 1000) * 70);
          setEntries((previous) =>
            previous.map((entry) =>
              entry.id === id
                ? { ...entry, text: REPLY.slice(0, length) }
                : entry,
            ),
          );
          if (length >= REPLY.length) setStreamingId(null);
          else timers.current.push(setTimeout(tick, 32));
        };
        tick();
      }, 900),
    );
  };

  const stop = () => {
    stopAll();
    setThinking(false);
    setStreamingId(null);
  };

  const busy = thinking || streamingId !== null;
  const grouped = runs(entries);
  const lastUserRun = grouped.map((run) => run[0]?.from).lastIndexOf("user");
  const replied = lastUserRun < grouped.length - 1;
  const delivery: MessageDelivery = replied
    ? "read"
    : thinking
      ? "delivered"
      : "sent";

  return (
    <DemoSection title="Following output">
      <DemoStatus>
        {following ? "Following the latest message." : "Paused while you read."}
      </DemoStatus>
      <View className="h-[470px] gap-3">
        <MessageScroller
          busy={busy}
          messageCount={entries.length}
          nestedScrollEnabled
          onFollowChange={setFollowing}
          contentClassName="pb-2 pt-1"
        >
          <MessageGroup spacing="default">
            {grouped.map((run, runIndex) => {
              const first = run[0] as Entry;
              const last = run[run.length - 1] as Entry;
              const user = first.from === "user";
              const streaming = run.some((entry) => entry.id === streamingId);
              return (
                <Message
                  key={first.id}
                  from={first.from}
                  animateIn={first.fresh}
                >
                  <MessageContent>
                    <MessageBubbleGroup>
                      {run.map((entry, index) => (
                        <MessageBubble
                          key={entry.id}
                          variant={user ? "solid" : "soft"}
                          animateIn={entry.fresh && index > 0}
                        >
                          {entry.text || " "}
                        </MessageBubble>
                      ))}
                    </MessageBubbleGroup>
                    {streaming ? null : (
                      <MessageStatus
                        time={last.time}
                        delivery={
                          user && runIndex === lastUserRun
                            ? delivery
                            : undefined
                        }
                      />
                    )}
                  </MessageContent>
                </Message>
              );
            })}
            {thinking ? (
              <Message from="assistant">
                <MessageContent>
                  <ThinkingShimmer>Reviewing your direction…</ThinkingShimmer>
                </MessageContent>
              </Message>
            ) : null}
          </MessageGroup>
        </MessageScroller>
        <PromptInput
          defaultValue="Fix the onboarding copy"
          placeholder="Message the agent"
          actions={ACTIONS}
          loading={busy}
          onSubmit={send}
          onStop={stop}
        />
      </View>
    </DemoSection>
  );
}
