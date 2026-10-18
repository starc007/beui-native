import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, FileDiff, type FileDiffLine } from "../../src";
import { DemoSection } from "./demo";

// The header, the gap above the panel, the 150 point diff and its copy footer.
const DIFF_HEIGHT = 40 + 6 + 150 + 38;

const DIFF: FileDiffLine[] = [
  {
    id: "1",
    oldLine: 18,
    newLine: 18,
    content: "export async function runTask() {",
  },
  { id: "2", type: "removed", oldLine: 19, content: "  return execute(task);" },
  {
    id: "3",
    type: "added",
    newLine: 19,
    content: "  const result = await execute(task);",
  },
  {
    id: "4",
    type: "added",
    newLine: 20,
    content: "  return normalize(result);",
  },
  { id: "5", oldLine: 20, newLine: 21, content: "}" },
];

const CONTEXT = [
  'import { describe, expect, test } from "bun:test";',
  'import { render } from "@testing-library/react-native";',
  'import { Tabs } from "../src";',
  "",
  'describe("Tabs", () => {',
  '  test("selects the first tab", () => {',
  "    const view = render(<Example />);",
  '    expect(view.getByRole("tab", { selected: true })).toBeTruthy();',
  "  });",
];
const LONG: FileDiffLine[] = [
  ...CONTEXT.map((content, index) => ({
    id: `c${index}`,
    oldLine: index + 1,
    newLine: index + 1,
    content,
  })),
  {
    id: "r1",
    type: "removed",
    oldLine: 10,
    content: '  test("moves the indicator", () => {',
  },
  {
    id: "a1",
    type: "added",
    newLine: 10,
    content: '  test("glides the indicator to the new tab", async () => {',
  },
  {
    id: "a2",
    type: "added",
    newLine: 11,
    content:
      '    await user.press(view.getByRole("tab", { name: "Activity" }));',
  },
  { id: "e1", oldLine: 11, newLine: 12, content: "  });" },
  { id: "e2", oldLine: 12, newLine: 13, content: "});" },
];

export function FileDiffShowcase() {
  const [visible, setVisible] = useState(0);
  const done = visible >= DIFF.length;
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => setComplete(true), 660);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(
      () => setVisible((n) => n + 1),
      visible === 0 ? 180 : 360,
    );
    return () => clearTimeout(timer);
  }, [done, visible]);

  return (
    <>
      <DemoSection
        title="Applying changes"
        description="Lines arrive with live counts, then the diff folds away once it's applied. Tap the file to reopen it."
      >
        {/* Holds the diff at its tallest, so streaming and folding never move the page. */}
        <View style={{ minHeight: DIFF_HEIGHT }}>
          <FileDiff
            file="src/runner.ts"
            lines={DIFF.slice(0, visible)}
            status={complete ? "complete" : "streaming"}
            maxHeight={150}
            onCopy={() =>
              Clipboard.setStringAsync(
                DIFF.map((line) => line.content).join("\n"),
              )
            }
          />
        </View>
        <Button
          className="self-center"
          size="sm"
          variant="ghost"
          onPress={() => {
            setComplete(false);
            setVisible(0);
          }}
        >
          Replay
        </Button>
      </DemoSection>
      <DemoSection
        title="Unchanged lines fold"
        description="Long stretches without changes collapse into a row. Tap it to see them."
      >
        <FileDiff
          file="tests/tabs.test.tsx"
          lines={LONG}
          status="complete"
          collapseOnComplete={false}
          language="tsx"
          maxHeight={260}
        />
      </DemoSection>
    </>
  );
}
