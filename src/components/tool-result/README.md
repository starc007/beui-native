# Tool Result

Native port of [beUI Tool Result](https://beui.dev/components/agents/tool-result): a tool call's output, streamed in while it runs.

```tsx
import * as Clipboard from "expo-clipboard";
import { ToolResult } from "./src";

<ToolResult
  tool="terminal.run"
  kind="terminal"
  title={running ? "Running tests" : "Tests passed"}
  meta={running ? undefined : "2.9s"}
  status={running ? "running" : "success"}
  onCopy={() => Clipboard.setStringAsync(output)}
  onRetry={runAgain}
>
  {output}
</ToolResult>
```

## Behavior

- String output renders in monospace; pass `ToolResultOutput` or any node for more control. `kind` picks the icon: `terminal`, `request` or `custom`.
- The title, `meta` note, tool name and status roll as they change.
- It opens when a run starts and folds away when it finishes. Keep it open with `collapseOnComplete={false}`, or control it with `open`.
- Copy (when you pass `onCopy`) shows a check for 1600 ms. Run again appears with `onRetry`.

## Better on a phone

- Output follows the newest line, but stops the moment you drag up to read and picks up again when you return to the end. The web version pulls you back on every line.
- The note and tool name sit on their own line under the title, so a phone-width header never truncates everything at once.

## Accessibility

- The header reads as the title, note, tool and status, and reports whether the output is expanded.
- The output is a polite live region on Android, and the result is marked busy while running.
- Reduced motion, or `disableAnimation`, rolls and folds without movement and holds the spinner still.

Copy this directory, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/disclosure.tsx`, `primitives/roll-text.tsx`, `primitives/spin-glyph.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icons.
