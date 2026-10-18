# Todo List

Native port of [beUI Todo List](https://beui.dev/components/agents/todo-list): an agent's plan as a checklist that updates as the agent works.

```tsx
import { TodoList } from "./src";

<TodoList
  title="Implementation plan"
  items={[
    { id: "1", title: "Inspect the data flow", status: "completed" },
    { id: "2", title: "Update the schema", status: "in-progress", progress: 50, detail: "50%" },
    { id: "3", title: "Add coverage", status: "pending" },
  ]}
/>
```

## Behavior

- Each task's mark morphs with its `status`: a dashed ring while `pending`, an arc filling to `progress` while `in-progress` (a spinning arc when there's no progress), a drawn check when `completed` and a cross when `cancelled`.
- Completed titles are struck through left to right.
- The header count rolls as tasks complete. When every task is done, the list icon turns into a green check and the list folds away; it reopens if a task becomes unfinished again. Turn that off with `collapseOnComplete={false}`, or control it with `open`.
- New tasks rise in, and the list scrolls to them once it's taller than `maxHeight` (248 points).

## Accessibility

- Each task reads as its status and title, such as "In progress: Update the schema".
- The header reads as the title and "2 of 4 tasks completed", and reports whether the list is expanded.
- Reduced motion, or `disableAnimation`, swaps marks and strikes without drawing and holds the spinner still.

Copy this directory, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/disclosure.tsx`, `primitives/rise-in.tsx`, `primitives/roll-text.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its marks.
