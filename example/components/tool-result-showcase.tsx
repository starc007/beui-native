import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  Button,
  ToolResult,
  ToolResultOutput,
  type ToolResultStatus,
} from "../../src";
import { DemoSection } from "./demo";

// Header, a 150 point output, its footer and the card's padding.
const CARD_HEIGHT = 58 + 150 + 44 + 14;

const LINES = [
  "$ bun test tests/a11y.test.tsx",
  "bun test v1.3.14",
  "✓ StreamingResponse complete",
  "✓ ToolApproval pending",
  "✓ Citations expanded",
  "✓ TodoList collapses when done",
  "✓ AgentActivity follows the stream",
  "49 pass · 0 fail",
];
const RESPONSE = `{
  "error": "rate_limit_exceeded",
  "retryAfter": 30,
  "requestId": "req_8f21"
}`;

function useRun(
  steps: number,
  interval: number,
  final: Exclude<ToolResultStatus, "running">,
  run: number,
) {
  const [visible, setVisible] = useState(0);
  const [status, setStatus] = useState<ToolResultStatus>("running");
  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` replays it
  useEffect(() => {
    setVisible(0);
    setStatus("running");
    const timers = Array.from({ length: steps }, (_, index) =>
      setTimeout(() => setVisible(index + 1), index * interval + 180),
    );
    timers.push(setTimeout(() => setStatus(final), steps * interval + 480));
    return () => timers.forEach(clearTimeout);
  }, [run]);
  return { visible, status };
}

export function ToolResultShowcase() {
  const [terminalRun, setTerminalRun] = useState(0);
  const [requestRun, setRequestRun] = useState(0);
  const terminal = useRun(LINES.length, 420, "success", terminalRun);
  const request = useRun(3, 600, "error", requestRun);
  const output = LINES.slice(0, terminal.visible).join("\n");

  return (
    <>
      <DemoSection title="Terminal output">
        {/* Holds the card at its tallest, so folding never moves the page. */}
        <View style={{ minHeight: CARD_HEIGHT }}>
          <ToolResult
            tool="terminal.run"
            kind="terminal"
            title={
              terminal.status === "running"
                ? "Running accessibility tests"
                : "Tests passed"
            }
            status={terminal.status}
            maxHeight={150}
            onCopy={() => Clipboard.setStringAsync(output)}
            onRetry={() => setTerminalRun((n) => n + 1)}
          >
            {output || " "}
          </ToolResult>
        </View>
      </DemoSection>
      <DemoSection title="Request result">
        {/* Holds the card at its tallest, so folding never moves the page. */}
        <View style={{ minHeight: CARD_HEIGHT }}>
          <ToolResult
            tool="http.request"
            kind="request"
            title={
              request.status === "running"
                ? "Fetching project activity"
                : "Request failed"
            }
            meta={request.status === "running" ? "GET /v1/activity" : "429"}
            status={request.status}
            collapseOnComplete={false}
            maxHeight={150}
            onCopy={() => Clipboard.setStringAsync(RESPONSE)}
            onRetry={() => setRequestRun((n) => n + 1)}
          >
            {request.status === "running" ? (
              <ToolResultOutput>
                {[
                  "Preparing request…",
                  "GET /v1/activity\nConnecting…",
                  "GET /v1/activity\nWaiting for response…",
                ][Math.min(request.visible, 2)] ?? ""}
              </ToolResultOutput>
            ) : (
              <ToolResultOutput>{RESPONSE}</ToolResultOutput>
            )}
          </ToolResult>
        </View>
        <Button
          className="self-center"
          size="sm"
          variant="ghost"
          onPress={() => {
            setTerminalRun((n) => n + 1);
            setRequestRun((n) => n + 1);
          }}
        >
          Replay
        </Button>
      </DemoSection>
    </>
  );
}
