# Prompt Input

Native port of [beUI Prompt Input](https://beui.dev/components/agents/prompt-input): a chat composer for agents, in the style of the ChatGPT app.

```tsx
import { PromptInput } from "./src";

<PromptInput
  actions={[{ value: "photos", label: "Add photos" }]}
  models={[
    { value: "balanced", label: "Balanced" },
    { value: "deep", label: "Deep reasoning" },
  ]}
  attachments={attachments}
  onRemoveAttachment={remove}
  onVoice={startDictation}
  loading={streaming}
  onSubmit={(prompt, model) => send(prompt, model)}
  onStop={stop}
/>
```

## Behavior

- While the prompt fits on one line, the composer is a soft pill: a + button, the field ("Ask anything"), and a button on the right.
- The right button is a mic while the field is empty and you pass `onVoice`, a primary send arrow once there's something to send, and stop while `loading`.
- When the text wraps, the pill opens into a card: the text takes the full width and the + and send buttons sit in a row underneath. It grows to `maxRows` (6) lines, then scrolls.
- `attachments` appear as chips above the text, each with a remove button when you pass `onRemoveAttachment`. A prompt can be sent with only attachments.
- The + opens a `Menu` listing `actions`, then the `models` under a "Model" heading with the selected one checked. Slide a finger through it to choose.
- Send submits the trimmed prompt with the selected model and clears the field when uncontrolled. Control it with `value` and `onValueChange`.
- `leadingAction` adds your own controls beside the + button once the composer opens into a card.
- Other `TextInput` props pass through to the field.

## Better on a phone

- Stopping a reply puts your last prompt back in an empty field, so you can adjust it and send again without retyping. Turn it off with `restoreOnStop={false}`.
- The + menu keeps models and actions in one place within thumb reach, so the composer itself stays a single clean line.
- The pill and card share one surface that glides between shapes, and the buttons glide to their new places.

## Motion

- Mic, send and stop trade places with a quick scale on one spring (stiffness 460, damping 30, mass 0.55).
- The + turns 45° while its menu is open, and the menu's rows fade down into place 30 ms apart.
- Buttons press to 0.9, and attachment chips rise in.

## Accessibility

- The field is named "Prompt", and the buttons "Add to prompt", "Voice", "Send prompt" and "Stop generating". The + button also says which model is selected.
- Menus are announced as menus, and the selected model as selected. Attachment chips have "Remove …" buttons.
- Reduced motion, or `disableAnimation`, swaps buttons and opens menus with fades only.

Keep the composer above the keyboard with your app's keyboard handling, such as `KeyboardStickyView` from react-native-keyboard-controller.

Copy this directory, `components/menu/`, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/render-icon.tsx`, `primitives/rise-in.tsx`, `primitives/overlay.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icons. Its overlay uses `FullWindowOverlay` from `react-native-screens` on iOS, so it covers native tab bars.
