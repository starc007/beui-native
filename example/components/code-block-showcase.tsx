import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, CodeBlock } from "../../src";
import { DemoSection } from "./demo";

// The header, the 240 point code area with its padding, and the borders.
const STREAM_HEIGHT = 44 + 1 + 240 + 2;

const LINES = [
  'import { generateText } from "ai";',
  "",
  "export async function summarize(input: string) {",
  "  const { text } = await generateText({",
  '    model: "anthropic/claude-sonnet-5",',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: demo source code
  "    prompt: `Summarize this clearly, in two sentences at most: ${input}`,",
  "  });",
  "",
  "  return {",
  "    text,",
  "    generatedAt: new Date().toISOString(),",
  "  };",
  "}",
];

const SCRIPT = `# Build, test and ship the showcase in one go
bun install --frozen-lockfile && bun check && bun run export --platform ios --platform android
eas update --channel production --message "Add the agent components" --non-interactive`;

export function CodeBlockShowcase() {
  const [visible, setVisible] = useState(1);
  const done = visible >= LINES.length;

  // Re-arms after each line; `visible` is the trigger.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => setVisible((n) => n + 1), 260);
    return () => clearTimeout(timer);
  }, [done, visible]);

  const code = LINES.slice(0, visible).join("\n");

  return (
    <>
      <DemoSection
        title="Streaming code"
        description="Lines stream in and stay highlighted as they arrive. Drag up and it stops following."
      >
        {/* Holds the block at its tallest, so streaming never moves the page. */}
        <View style={{ minHeight: STREAM_HEIGHT }}>
          <CodeBlock
            code={code}
            filename="summarize.ts"
            language="typescript"
            status={done ? "complete" : "streaming"}
            highlightLines={[4, 5, 6, 7]}
            maxHeight={240}
            onCopy={() => Clipboard.setStringAsync(LINES.join("\n"))}
          />
        </View>
        <Button
          className="self-center"
          size="sm"
          variant="ghost"
          onPress={() => setVisible(1)}
        >
          Replay
        </Button>
      </DemoSection>
      <DemoSection
        title="Long lines"
        description="Swipe a long line sideways and the numbers stay put, or tap the wrap button to fold it."
      >
        <CodeBlock
          code={SCRIPT}
          filename="ship.sh"
          language="bash"
          onCopy={() => Clipboard.setStringAsync(SCRIPT)}
        />
      </DemoSection>
    </>
  );
}
