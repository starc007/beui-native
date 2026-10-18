import { useEffect, useState } from "react";
import {
  Button,
  ToolApproval,
  ToolApprovalCode,
  type ToolApprovalStatus,
} from "../../src";
import { DemoSection, DemoStatus } from "./demo";

const PARAMETERS = [
  {
    id: "command",
    label: "Command",
    value: <ToolApprovalCode code="bun test tests/a11y.test.tsx" />,
  },
  { id: "directory", label: "Directory", value: "beui-native" },
];

export function ToolApprovalShowcase() {
  const [status, setStatus] = useState<ToolApprovalStatus>("pending");
  const [open, setOpen] = useState(true);
  const [run, setRun] = useState(0);

  // Plays the run once per approval; status changes don't restart it.
  useEffect(() => {
    if (run === 0) return;
    const timers = [
      setTimeout(() => setStatus("approved"), 600),
      setTimeout(() => setStatus("running"), 1150),
      setTimeout(() => setStatus("complete"), 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [run]);

  const approve = () => {
    setStatus("approving");
    setRun((n) => n + 1);
  };

  return (
    <DemoSection
      title="Run a command"
      description="Allowing takes a press and hold, so a stray tap can't run a tool. A quick tap says so. The details fold away once you decide."
    >
      <DemoStatus>
        {status === "pending"
          ? "Waiting for your decision."
          : status === "denied"
            ? "Denied. The agent won't run it."
            : status === "complete"
              ? "The tests ran."
              : "Running the tests…"}
      </DemoStatus>
      <ToolApproval
        tool="terminal.run"
        title={
          status === "pending" ? "Allow this tool to run?" : "Terminal access"
        }
        description="The agent wants to run the project test suite in the current workspace."
        parameters={PARAMETERS}
        status={status}
        open={open}
        onOpenChange={setOpen}
        onApprove={approve}
        onAlwaysAllow={approve}
        onDeny={() => setStatus("denied")}
      />
      <Button
        className="self-center"
        size="sm"
        variant="ghost"
        disabled={status === "pending"}
        onPress={() => {
          setStatus("pending");
          setOpen(true);
        }}
      >
        Replay
      </Button>
    </DemoSection>
  );
}
