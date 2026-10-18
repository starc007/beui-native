import { useEffect, useState } from "react";
import {
  Button,
  ToolApproval,
  ToolApprovalCode,
  type ToolApprovalStatus,
} from "../../src";
import { DemoSection } from "./demo";

const TEST_PARAMETERS = [
  {
    id: "command",
    label: "Command",
    value: <ToolApprovalCode code="bun test tests/a11y.test.tsx" />,
  },
  { id: "directory", label: "Directory", value: "beui-native" },
];
const DELETE_PARAMETERS = [
  {
    id: "command",
    label: "Command",
    value: <ToolApprovalCode code="rm -rf build/ .expo/ node_modules/.cache" />,
  },
  { id: "directory", label: "Directory", value: "beui-native" },
];

/** Steps a run from approving to its outcome, like a real agent would. */
function useRun(final: "complete" | "error") {
  const [status, setStatus] = useState<ToolApprovalStatus>("pending");
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (run === 0) return;
    const timers = [
      setTimeout(() => setStatus("approved"), 500),
      setTimeout(() => setStatus("running"), 900),
      setTimeout(() => setStatus(final), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [final, run]);
  return {
    status,
    approve: () => {
      setStatus("approving");
      setRun((n) => n + 1);
    },
    deny: () => setStatus("denied"),
    reset: () => setStatus("pending"),
  };
}

export function ToolApprovalShowcase() {
  const tests = useRun("complete");
  const cleanup = useRun("error");

  return (
    <>
      <DemoSection
        title="Run a command"
        description="Hold Allow once to run it; a quick tap says to hold. The card follows the run and ends with the result."
      >
        <ToolApproval
          tool="terminal.run"
          title="Run the test suite?"
          description="The agent wants to run the accessibility tests in this project."
          parameters={TEST_PARAMETERS}
          status={tests.status}
          result={
            tests.status === "denied"
              ? "You denied this. The agent will look for another way."
              : "49 tests passed in 2.1s."
          }
          onApprove={tests.approve}
          onAlwaysAllow={tests.approve}
          onDeny={tests.deny}
        />
        <Button
          className="self-center"
          size="sm"
          variant="ghost"
          disabled={tests.status === "pending"}
          onPress={tests.reset}
        >
          Replay
        </Button>
      </DemoSection>
      <DemoSection
        title="High risk"
        description="Tools that can lose work need a longer hold, and the card says why."
      >
        <ToolApproval
          tool="terminal.run"
          title="Delete the build caches?"
          description="The agent wants to clear caches to fix a stale bundle."
          parameters={DELETE_PARAMETERS}
          risk="high"
          riskNote="Deletes files. This can't be undone."
          status={cleanup.status}
          result={
            cleanup.status === "denied"
              ? "You denied this. Nothing was deleted."
              : "rm: node_modules/.cache: Permission denied"
          }
          onApprove={cleanup.approve}
          onDeny={cleanup.deny}
        />
        <Button
          className="self-center"
          size="sm"
          variant="ghost"
          disabled={cleanup.status === "pending"}
          onPress={cleanup.reset}
        >
          Replay
        </Button>
      </DemoSection>
    </>
  );
}
