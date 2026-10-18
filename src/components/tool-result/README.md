# Tool Result

Native port of [beUI Tool Result](https://beui.dev/components/agents/tool-result): a tool call's output, streamed in while it runs.

```tsx
import * as Clipboard from "expo-clipboard";
import { ToolResult } from "./src";

<ToolResult
  tool="terminal.run"
  kind="terminal"
  title={running ? "Running tests" : "Tests passed"}
  status={running ? "running" : "success"}
  onCopy={() => Clipboard.setStringAsync(output)}
  onRetry={runAgain}
>
  {output}
</ToolResult>
```

## Behavior

- String output renders in monospace; pass `ToolResultOutput` or any node for more control. `kind` picks the icon: `terminal`, `request` or `custom`.
- It's a card: a header with the kind's icon, the title, the tool name and a note, and a status pill (Running, Completed, Failed, Cancelled) that rolls as it changes.
- Without a `meta` note, the header times the run: it counts up while running and holds the final time, such as "4.1s". Pass `meta` for your own note, such as a status code.
- The output sits in an inset box, tinted red when the run fails. Its footer holds copy and run again, and counts the lines of string output.
- A thin bar slides along the card's bottom edge while it runs.
- It opens when a run starts and folds away when it finishes. Keep it open with `collapseOnComplete={false}`, or control it with `open`.
- Copy (when you pass `onCopy`) shows a check for 1600 ms. Run again appears with `onRetry`.

## Better on a phone

- Output follows the newest line, but stops the moment you drag up to read and picks up again when you return to the end. The web version pulls you back on every line.
- The note and tool name sit on their own line under the title, so a phone-width header never truncates everything at once.

## Accessibility

- The header reads as the title, note, tool and status, and reports whether the output is expanded.
- The output is a polite live region on Android, and the result is marked busy while running.
- Reduced motion, or `disableAnimation`, rolls and folds without movement and holds the spinner still.

Copy this directory, `primitives/running-bar.tsx`, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/disclosure.tsx`, `primitives/roll-text.tsx`, `primitives/spin-glyph.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icons.
