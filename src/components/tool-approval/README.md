# Tool Approval

Native port of [beUI Tool Approval](https://beui.dev/components/agents/tool-approval): asks before an agent runs a tool.

```tsx
import { ToolApproval, ToolApprovalCode } from "./src";

<ToolApproval
  tool="terminal.run"
  description="The agent wants to run the test suite."
  parameters={[{ id: "command", label: "Command", value: <ToolApprovalCode code="bun test" /> }]}
  status={status}
  onApprove={allow}
  onAlwaysAllow={allowAlways}
  onDeny={deny}
/>
```

## Behavior

- `parameters` sit behind "View details", each label above its value. `ToolApprovalCode` sets commands in monospace.
- You move `status` forward through `approving`, `approved`, `running`, `complete` or `error`, or `denied`. The badge and icon follow it, spinning while busy.
- Once you decide, the details fold away and the actions leave.

## Better on a phone

Allowing takes a press and hold (600 ms, set with `holdDuration`), so a stray thumb can't run a tool. A fill sweeps across the button while you hold and drains back if you let go early. The label coaches you: "Keep holding…" while pressed, and "Hold to allow" after a tap that let go too soon. The widest label holds the button's width, so nothing beside it shifts. Use `confirm="tap"` for tools that are safe to allow with a tap.

## Accessibility

- Screen reader users allow with a double tap; the button's hint says to press and hold.
- The status badge is a polite live region, and the card is marked busy while approving or running.
- Reduced motion, or `disableAnimation`, folds without movement and holds the spinner still. The hold fill still shows progress.

Copy this directory, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/disclosure.tsx`, `primitives/roll-text.tsx`, `primitives/spin-glyph.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icons.
