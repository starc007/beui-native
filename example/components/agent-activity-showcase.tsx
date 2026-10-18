import * as Linking from "expo-linking";
import { useState } from "react";
import { View } from "react-native";
import {
  AgentActivity,
  type AgentActivityItem,
  type AgentActivityStatus,
  Button,
} from "../../src";
import { DemoSection } from "./demo";
import { useTimeline } from "./use-timeline";

type Frame = {
  at: number;
  value: { items: AgentActivityItem[]; status: AgentActivityStatus };
};

function frames(
  steps: AgentActivityItem[][],
  every: number,
  start: number,
  finish: number,
): Frame[] {
  return [
    { at: 0, value: { items: [], status: "working" } },
    ...steps.map((items, index) => ({
      at: start + index * every,
      value: { items, status: "working" as const },
    })),
    {
      at: start + (steps.length - 1) * every + finish,
      value: {
        items: steps[steps.length - 1] ?? [],
        status: "complete" as const,
      },
    },
  ];
}

const STEP = (
  id: string,
  label: string,
  status: "active" | "complete",
  meta?: string,
) => ({ id, type: "step", label, status, meta }) as const;

const STEPS = frames(
  [
    [STEP("brief", "Reading the product brief", "active")],
    [
      STEP("brief", "Reading the product brief", "complete"),
      STEP("patterns", "Mapping the interaction patterns", "active"),
    ],
    [
      STEP("brief", "Reading the product brief", "complete"),
      STEP("patterns", "Mapping the interaction patterns", "complete"),
      STEP(
        "states",
        "Connecting the loading and completion states",
        "active",
        "3 states",
      ),
    ],
    [
      STEP("brief", "Reading the product brief", "complete"),
      STEP("patterns", "Mapping the interaction patterns", "complete"),
      STEP(
        "states",
        "Connecting the loading and completion states",
        "complete",
        "3 states",
      ),
      STEP("verify", "Verifying the final behavior", "active"),
    ],
    [
      STEP("brief", "Reading the product brief", "complete"),
      STEP("patterns", "Mapping the interaction patterns", "complete"),
      STEP(
        "states",
        "Connecting the loading and completion states",
        "complete",
        "3 states",
      ),
      STEP("verify", "Verifying the final behavior", "complete"),
    ],
  ],
  800,
  400,
  700,
);

const RESULTS = [
  {
    id: "google",
    title: "Google for Developers",
    domain: "developers.google.com",
    url: "https://developers.google.com",
  },
  {
    id: "github",
    title: "GitHub",
    domain: "github.com",
    url: "https://github.com",
  },
  {
    id: "wikipedia",
    title: "Wikipedia",
    domain: "wikipedia.org",
    url: "https://wikipedia.org",
  },
  {
    id: "expo",
    title: "Expo Docs",
    domain: "docs.expo.dev",
    url: "https://docs.expo.dev",
  },
];
const SEARCH = frames(
  [0, 1, 2, 3, 4].map((count) => [
    {
      id: "search",
      type: "search" as const,
      query: "accessible animation patterns for React Native",
      results: RESULTS.slice(0, count),
      moreCount: count === 4 ? 7 : undefined,
    },
  ]),
  650,
  300,
  800,
);

const TOOL_ITEMS: AgentActivityItem[] = [
  { id: "read", type: "tool", action: "read", target: "campaign-notes.md" },
  {
    id: "edit",
    type: "tool",
    action: "edit",
    target: "launch-plan.ts",
    additions: 42,
    deletions: 8,
  },
  { id: "run", type: "tool", action: "run", target: "bun test launch" },
];
const TOOLS = frames(
  [1, 2, 3].map((n) => TOOL_ITEMS.slice(0, n)),
  850,
  500,
  900,
);

const TRACE_ITEMS: AgentActivityItem[] = [
  {
    id: "plan",
    type: "trace",
    kind: "thinking",
    label: "Thinking",
    detail: "Mapping the interaction flow…",
  },
  {
    id: "decision",
    type: "trace",
    kind: "message",
    label: "Decision",
    detail: "Use one compact disclosure",
  },
  {
    id: "write",
    type: "trace",
    kind: "write",
    label: "Draft component",
    detail: "run-log.tsx",
  },
  {
    id: "verify",
    type: "trace",
    kind: "run",
    label: "Validate types",
    detail: "bun run typecheck",
  },
  {
    id: "inspect",
    type: "trace",
    kind: "read",
    label: "Inspect preview",
    detail: "activity.png",
  },
];
const TRACE = frames(
  [1, 2, 3, 4, 5].map((n) => TRACE_ITEMS.slice(0, n)),
  650,
  250,
  600,
);

const REASONING = [
  "Reading the request and separating the content from how it's shown.",
  "The log can stay the same while each event brings its own compact row.",
  "As each sentence arrives, the stream glides up so the newest line stays at the bottom edge.",
  "Older context stays above the fold while the newest words stay in view.",
  "Once the run finishes, the log becomes yours to scroll.",
  "Opening it again starts from the top, so the reasoning reads in order.",
];
const TEXT = frames(
  REASONING.map((_, index) =>
    REASONING.slice(0, index + 1).map((content, line) => ({
      id: `reasoning-${line}`,
      type: "text" as const,
      content,
    })),
  ),
  700,
  300,
  600,
);

function Demo({
  timeline,
  duration,
  maxHeight,
  activeLabel,
}: {
  timeline: Frame[];
  duration?: number;
  maxHeight?: number;
  activeLabel?: string;
}) {
  const [run, setRun] = useState(0);
  const frame = useTimeline(timeline, run);
  return (
    <View className="gap-3">
      <View>
        <AgentActivity
          key={run}
          items={frame.items}
          status={frame.status}
          duration={duration}
          maxHeight={maxHeight}
          activeLabel={activeLabel}
          onOpenResult={(result) => {
            if (result.url) void Linking.openURL(result.url);
          }}
        />
      </View>
      <Button
        className="self-center"
        size="sm"
        variant="ghost"
        onPress={() => setRun((n) => n + 1)}
      >
        Replay
      </Button>
    </View>
  );
}

export function AgentActivityShowcase() {
  return (
    <>
      <DemoSection
        title="Reasoning steps"
        description="Each step pulses while active and gets a check when done. Once the run finishes, it folds into a summary you can tap open."
      >
        <Demo timeline={STEPS} duration={4.2} />
      </DemoSection>
      <DemoSection
        title="Streaming thoughts"
        description="The newest line stays pinned to the bottom as the log glides up. Afterwards the whole log scrolls."
      >
        <Demo timeline={TEXT} duration={5} maxHeight={160} />
      </DemoSection>
      <DemoSection
        title="Web search"
        description="Results rise in one by one. Tap one to open it."
      >
        <Demo timeline={SEARCH} />
      </DemoSection>
      <DemoSection
        title="Tool calls"
        description="Reads, edits with line counts, and commands."
      >
        <Demo timeline={TOOLS} />
      </DemoSection>
      <DemoSection
        title="Agent trace"
        description="Thinking, decisions and tool calls in one run."
      >
        <Demo
          timeline={TRACE}
          activeLabel="Running the agent trace…"
          maxHeight={190}
        />
      </DemoSection>
    </>
  );
}
