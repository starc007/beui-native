# Approval Card

Native port of [beUI Approval Card](https://beui.dev/components/agents/approval-card): asks a person to weigh in before an agent continues.

```tsx
import { ApprovalCard } from "./src";

// A few questions, one at a time
<ApprovalCard
  questions={[
    { id: "scope", title: "How focused should the release be?", options, allowCustom: true },
    { id: "checks", title: "Which checks should block publishing?", options: checks, multiple: true },
  ]}
  status={status}
  onSubmit={(answers) => send(answers)}
/>

// Or a review to approve
<ApprovalCard
  title="Publish the update?"
  status={status}
  onApprove={approve}
  onRequestChanges={requestChanges}
  onReject={reject}
>
  {summary}
</ApprovalCard>
```

## Questions

- Single-choice questions use radios and move on 240 ms after a choice, unless `autoAdvance` is false. `multiple` questions use checkboxes.
- `allowCustom` adds a text answer; with no options, the question is free text only. The keyboard's return key moves on.
- Answers and the step are uncontrolled by default; control them with `answers` and `step`.
- After the last question, `onSubmit` gets every answer. Move `status` to `submitting` and then `answered`.

## Review

Without questions, the card shows your `description` and `children`, with Approve and, when you pass their handlers, Request changes and Reject. Move `status` to `approved`, `changes-requested` or `rejected`.

Once decided, the card folds into its status, or your `result` text.

## Better on a phone

- Swipe left for the next question and right for the previous one. A swipe that can't go anywhere, such as past an unanswered question, pulls with resistance and springs back.
- Questions slide in from the side you're heading toward and the old one slides out the other way, so going back feels like going back.
- Long question titles wrap instead of truncating.

## Accessibility

- Options are native radios and checkboxes with their labels and descriptions.
- The progress dots read as "Question 2 of 3".
- Reduced motion, or `disableAnimation`, swaps questions and folds without movement.

Copy this directory, `components/button/`, `components/checkbox/`, `components/input/` and `components/radio/` with their files, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/disclosure.tsx`, `primitives/roll-text.tsx`, `primitives/spin-glyph.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` and Gesture Handler.
