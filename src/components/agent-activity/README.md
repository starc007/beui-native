# Agent Activity

Native port of [beUI Agent Activity](https://beui.dev/components/agents/agent-activity): what an agent is doing, as it does it, in one log.

```tsx
import { AgentActivity } from "./src";

<AgentActivity
  status={done ? "complete" : "working"}
  duration={seconds}
  items={[
    { id: "brief", type: "step", label: "Reading the brief", status: "complete" },
    { id: "search", type: "search", query: "coffee roasters in Portland", results },
    { id: "edit", type: "tool", action: "edit", target: "launch-plan.ts", additions: 42, deletions: 8 },
  ]}
/>
```

## Items

Append or update items as events stream in. Each has an `id` and a `type`:

- `step`: a label with a `pending`, `active` (pulsing) or `complete` (checked) status, and optional `meta`.
- `text`: freeform reasoning.
- `search`: a query with `results` that rise in one by one, and a `moreCount`. Results with a `url` call `onOpenResult` when tapped.
- `tool`: a `read`, `edit` or `run` (or any action) on a `target`, with optional line counts.
- `trace`: a `thinking`, `message`, `write`, `run` or `read` event with a `detail`.

## Behavior

- While `status` is `working`, the header shimmers with a label derived from the items ("Searching the web…", "Running tools…"), or your `activeLabel`.
- The log grows up to `maxHeight` (208 points), then glides up so the newest entry stays pinned to the bottom edge, with the older ones fading out under the top.
- When the run completes, the log folds into a summary such as "Thought for 4s" or "Ran 3 tools" (or your `summary`). Tap it to reopen the log, which starts from the top and scrolls on its own. Keep it open with `collapseOnComplete={false}`, or control it with `open`.

## Better on a phone

- One scroll view serves both phases, so rows never remount or replay their entrance when the run finishes.
- The log's height eases as rows arrive instead of jumping.
- Rows that leave lift away instead of vanishing.

## Accessibility

- The working label is a polite live region, and the log is marked busy while working.
- The summary is a button that reports whether the log is expanded.
- Reduced motion, or `disableAnimation`, shows rows and folds without movement and holds the active step's pulse still.

Copy this directory, `components/loading-states/thinking-shimmer.tsx`, `components/text-animation/text-shimmer.tsx`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/disclosure.tsx`, `primitives/fade-edge.tsx`, `primitives/glyph-row.tsx`, `primitives/rise-in.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icons.
