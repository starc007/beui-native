import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import {
  Message,
  MessageBubble,
  MessageContent,
  MessageGroup,
  MessageScroller,
  PromptInput,
  StreamingResponse,
  ThinkingShimmer,
} from "../../src";
import { DemoSection, DemoStatus } from "./demo";

type Entry = {
  id: number;
  from: "user" | "assistant";
  text: string;
  fresh?: boolean;
};

const SEED: Entry[] = [
  ["user", "What's left before the launch?"],
  [
    "assistant",
    "Three things: the store screenshots, the release notes, and a last pass on onboarding.",
  ],
  ["user", "Screenshots are done."],
  ["assistant", "Great. That leaves the notes and onboarding."],
  ["user", "Can you draft the notes?"],
  ["assistant", "Sure. Do you want them short, or with a line per fix?"],
  ["user", "Short, please."],
  [
    "assistant",
    "Faster sync, a new export menu, and fewer duplicate notifications.",
  ],
  ["user", "Perfect. And onboarding?"],
  [
    "assistant",
    "The second screen still says “workspace”. I'd change it to “project” to match the app.",
  ],
].map(([from, text], id) => ({
  id,
  from: from as Entry["from"],
  text: text as string,
}));

const REPLY =
  "Done. I renamed every “workspace” on the onboarding screens to “project”, updated the illustration captions to match, and checked the empty states too. Scroll up while this streams: the conversation stops following you, and the pill brings you back to the newest message. Once you're at the bottom again it keeps following as the reply grows, line after line, until it's finished.";

export function MessageScrollerShowcase() {
  const [entries, setEntries] = useState(SEED);
  const [streamed, setStreamed] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [following, setFollowing] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => () => clearInterval(timer.current), []);

  const send = (text: string) => {
    clearInterval(timer.current);
    setEntries((previous) => [
      ...previous,
      { id: Date.now(), from: "user", text, fresh: true },
    ]);
    setThinking(true);
    setStreamed(null);
    setTimeout(() => {
      setThinking(false);
      const startedAt = Date.now();
      timer.current = setInterval(() => {
        const length = Math.floor(((Date.now() - startedAt) / 1000) * 70);
        if (length >= REPLY.length) {
          clearInterval(timer.current);
          setStreamed(null);
          setEntries((previous) => [
            ...previous,
            { id: Date.now(), from: "assistant", text: REPLY },
          ]);
        } else {
          setStreamed(REPLY.slice(0, length));
        }
      }, 32);
    }, 700);
  };

  const busy = thinking || streamed !== null;

  return (
    <DemoSection
      title="Following output"
      description="New output keeps the latest message in view. Drag up to read and it lets go."
    >
      <DemoStatus>
        {following ? "Following the latest message." : "Paused while you read."}
      </DemoStatus>
      <View className="h-[460px] overflow-hidden rounded-2xl border border-border bg-background">
        <MessageScroller
          busy={busy}
          messageCount={entries.length}
          nestedScrollEnabled
          onFollowChange={setFollowing}
          contentClassName="p-4"
        >
          <MessageGroup spacing="default">
            {entries.map((entry) => (
              <Message key={entry.id} from={entry.from} animateIn={entry.fresh}>
                <MessageContent>
                  <MessageBubble
                    variant={entry.from === "user" ? "solid" : "soft"}
                  >
                    {entry.text}
                  </MessageBubble>
                </MessageContent>
              </Message>
            ))}
            {thinking ? (
              <ThinkingShimmer>Reviewing your direction…</ThinkingShimmer>
            ) : null}
            {streamed !== null ? (
              <Message from="assistant">
                <MessageContent>
                  <MessageBubble variant="ghost">
                    <StreamingResponse status="streaming" announce={false}>
                      {streamed}
                    </StreamingResponse>
                  </MessageBubble>
                </MessageContent>
              </Message>
            ) : null}
          </MessageGroup>
        </MessageScroller>
        <View className="border-t border-border p-2">
          <PromptInput
            defaultValue="Fix the onboarding copy"
            placeholder="Message the agent…"
            loading={busy}
            onSubmit={send}
            className="border-0"
          />
        </View>
      </View>
    </DemoSection>
  );
}
