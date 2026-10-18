# Tool Approval

Native port of [beUI Tool Approval](https://beui.dev/components/agents/tool-approval): asks before an agent runs a tool, then follows the run to its result.

```tsx
import { ToolApproval, ToolApprovalCode } from "./src";

<ToolApproval
  tool="terminal.run"
  title="Run the test suite?"
  description="The agent wants to run the accessibility tests."
  parameters={[{ id: "command", label: "Command", value: <ToolApprovalCode code="bun test" /> }]}
  status={status}
  result="49 tests passed in 2.1s."
  onApprove={allow}
  onAlwaysAllow={allowAlways}
  onDeny={deny}
/>
```

## Layout

- A quiet top line holds the tool's name and where the run is ("Approval required", "Running", "Completed"), with a matching icon. The status rolls as it changes.
- The title and description span the card. `parameters` sit behind "View details", each label above its value; `ToolApprovalCode` sets commands in monospace.
- "Allow once" spans the card, with "Always allow" (when you pass `onAlwaysAllow`) and "Deny" sharing the row beneath it.

## Behavior

- You move `status` forward: `approving`, `approved`, `running`, then `complete` or `error`; or `denied`. Once you decide, the details fold away and the actions leave.
- While approving or running, a thin bar slides along the card's bottom edge.
- When the run ends, `result` appears in the card: green for `complete`, red for `error`, neutral for `denied`. The card tells the whole story, not just the request.

## Risk

`risk` sets how careful allowing is:

- `low`: a tap allows.
- `normal` (the default): allowing takes a 600 ms press and hold.
- `high`: a 900 ms hold, a red-tinted card and Allow button, and `riskNote` explaining why, such as "Deletes files. This can't be undone."

`confirm` and `holdDuration` override these.

## Better on a phone

- The hold means a stray thumb can't run a tool. A fill sweeps across the button while you hold and drains back if you let go early. The label coaches you: "Keep holding…" while pressed, "Hold to allow" after a tap that let go too soon.
- The actions are full width and 46 points tall, easy to hit with a thumb.
- The card follows the run to its result instead of handing off to another component.

## Accessibility

- Screen reader users allow with a double tap; the button's hint says to press and hold.
- The status line is a polite live region, and the card is marked busy while approving or running.
- Reduced motion, or `disableAnimation`, folds without movement, holds the spinner still and shows the running bar as a static tint. The hold fill still shows progress.

Copy this directory, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/disclosure.tsx`, `primitives/roll-text.tsx`, `primitives/spin-glyph.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icons.
