# Code Block

Native port of [beUI Code Block](https://beui.dev/components/agents/code-block): highlighted code that an agent writes line by line.

```tsx
import * as Clipboard from "expo-clipboard";
import { CodeBlock } from "./src";

<CodeBlock
  code={code}
  filename="summarize.ts"
  language="typescript"
  status={writing ? "streaming" : "complete"}
  highlightLines={[4, 5]}
  onCopy={() => Clipboard.setStringAsync(code)}
/>
```

## Behavior

- Highlighting covers TypeScript, TSX, JavaScript, JSX, JSON, Bash, Python, Swift, Kotlin, Go, Rust, SQL, CSS, YAML and Markdown, in colors that follow light and dark mode. Use `"text"` for none.
- While `status` is `streaming`, the header says "Writing" and the view follows new lines. It says "Ready" once complete.
- `highlightLines` tints whole rows, numbers included. `showLineNumbers` turns the numbers off.
- Copy appears when you pass `onCopy` and shows a check for 1600 ms.

## Better on a phone

- Line numbers stay put while long lines scroll sideways, so you never lose track of which line you're on.
- A button in the header wraps long lines instead, and back. Start wrapped with `wrap`.
- Following stops the moment you drag up to read and resumes when you return to the end.
- Highlighting runs in plain JavaScript as the code arrives, so streamed lines never flash back to plain text.

## Accessibility

- The status is a polite live region, and the block is marked busy while streaming.
- The copy and wrap buttons have names, and wrap reports whether it's on.
- Reduced motion, or `disableAnimation`, follows without smooth scrolling and holds the spinner still.

Copy this directory, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/code-tokens.ts`, `primitives/spin-glyph.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` and `prism-react-renderer` for tokenizing.
