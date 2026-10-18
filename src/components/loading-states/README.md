# Agent Loading States

Native port of [beUI Agent Loading States](https://beui.dev/components/agents/loading-states): three ways to show that an agent is working.

```tsx
import { AgentProgress, ReasoningText, ThinkingShimmer } from "./src";

<ThinkingShimmer>Thinking…</ThinkingShimmer>
<ReasoningText variant="cascade" />
<AgentProgress label="Churning" initialSeconds={12} />
```

## ThinkingShimmer

A highlight sweeps across a muted status line every 1800 ms. It wraps `TextShimmer`, so it takes the same props.

## ReasoningText

Cycles through `phrases` every `interval` ms (1800 by default, never under 600), adding an ellipsis to each. A terminal line spinner sits in front; replace it with `indicator`, or pass `null` to hide it. The longest phrase reserves the width, so nothing beside it moves.

- `cascade`: the old letters roll up and away as the new ones spring in from below, 25 ms apart.
- `swap`: the whole phrase fades and rises 3 points over 200 ms.
- `scramble`: characters cycle through random glyphs and settle left to right.

## AgentProgress

A 3×3 glyph whose cells pulse in reading order, 140 ms apart, over a 1550 ms cycle, beside a label and an elapsed timer. The timer counts up from `initialSeconds` every 100 ms while `running`, or shows `elapsedSeconds` when you control it. Past a minute it reads `2m 31.6s`.

## Accessibility

- ReasoningText is a polite live region whose label is the current phrase, without the ellipsis.
- AgentProgress is a progress bar named "Churning, in progress". The timer isn't announced on every tick.
- Reduced motion, or `disableAnimation`, keeps every state readable: the shimmer stays muted, phrases swap without movement, and the glyph cells only fade.

Copy this directory, `components/text-animation/text-shimmer.tsx` and `text-scramble.tsx`, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/cascade-text.tsx`, `primitives/glyph-row.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
