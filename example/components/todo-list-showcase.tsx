import { useEffect, useState } from "react";
import { Button, type TodoItem, TodoList } from "../../src";
import { DemoSection } from "./demo";

const TASKS = [
  "Inspect the current data flow",
  "Update the response schema",
  "Add coverage for edge cases",
  "Run checks and prepare the result",
];
const TICKS = 4;
const TICK = 320;

function plan(step: number): TodoItem[] {
  return TASKS.map((title, index) => {
    if (step >= TICKS * (index + 1))
      return { id: `task-${index}`, title, status: "completed" };
    if (step >= TICKS * index) {
      const progress = ((step % TICKS) + 1) * 25;
      return {
        id: `task-${index}`,
        title,
        status: "in-progress",
        progress,
        detail: `${progress}%`,
      };
    }
    return { id: `task-${index}`, title, status: "pending" };
  });
}

const CANCELLED: TodoItem[] = [
  { id: "a", title: "Draft the migration", status: "completed" },
  { id: "b", title: "Back up production", status: "in-progress" },
  { id: "c", title: "Drop the legacy table", status: "cancelled" },
  { id: "d", title: "Announce the change", status: "pending" },
];

export function TodoListShowcase() {
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (step >= TASKS.length * TICKS) return;
    const timer = setTimeout(
      () => setStep((n) => n + 1),
      step < 0 ? 600 : TICK,
    );
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <>
      <DemoSection
        title="Implementation plan"
        description="Each mark fills as its task progresses and turns into a check. Finished titles are struck through, and the list folds away when everything's done."
      >
        <TodoList title="Implementation plan" items={plan(Math.max(step, 0))} />
        <Button
          className="self-center"
          size="sm"
          variant="ghost"
          onPress={() => setStep(-1)}
        >
          Replay
        </Button>
      </DemoSection>
      <DemoSection
        title="Every state"
        description="Pending, in progress with an unknown end, completed and cancelled."
      >
        <TodoList title="Database cleanup" items={CANCELLED} />
      </DemoSection>
    </>
  );
}
