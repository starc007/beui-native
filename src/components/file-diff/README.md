# File Diff

Native port of [beUI File Diff](https://beui.dev/components/agents/file-diff): a file's changes as an agent applies them.

```tsx
import { FileDiff } from "./src";

<FileDiff
  file="src/runner.ts"
  status={applying ? "streaming" : "complete"}
  lines={[
    { id: "1", oldLine: 18, newLine: 18, content: "export async function runTask() {" },
    { id: "2", type: "removed", oldLine: 19, content: "  return execute(task);" },
    { id: "3", type: "added", newLine: 19, content: "  return normalize(await execute(task));" },
  ]}
/>
```

## Behavior

- Each line is `added`, `removed` or `context` (the default), with old and new line numbers. Added and removed rows are tinted, and the header counts them as they arrive.
- Code is highlighted in `language` (TypeScript by default).
- It opens while changes stream in, follows the newest line, and folds away once `status` is `complete`. Keep it open with `collapseOnComplete={false}`, or control it with `open`.
- Copy appears when you pass `onCopy`.

## Better on a phone

- Long stretches of unchanged lines fold into a row such as "7 unchanged lines", keeping `context` (2) lines beside each change, so a small screen shows the changes rather than the context. Tap the row to see the lines. A stretch at the end isn't folded while changes are still arriving.
- Line numbers and +/− markers stay put while code scrolls sideways.
- Following stops while you drag up to read.

## Accessibility

- The header reads as the file, the counts and whether changes are applied, and reports whether the diff is expanded.
- Each row reads as "Added 19: …", "Removed 19: …" or "Line 18: …".
- Reduced motion, or `disableAnimation`, folds without movement and holds the spinner still.

Copy this directory, `components/code-block/code-block.tsx`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/code-tokens.ts`, `primitives/disclosure.tsx`, `primitives/spin-glyph.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` and `prism-react-renderer`.
