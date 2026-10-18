# Prompt Input

Native port of [beUI Prompt Input](https://beui.dev/components/agents/prompt-input): a chat composer for agents.

```tsx
import { PromptInput } from "./src";

<PromptInput
  models={[
    { value: "balanced", label: "Balanced" },
    { value: "deep", label: "Deep reasoning" },
  ]}
  actions={[{ value: "image", label: "Attach image", description: "From your photos" }]}
  loading={streaming}
  onSubmit={(prompt, model) => send(prompt, model)}
  onStop={stop}
/>
```

## Behavior

- The field grows with its text from `minRows` (1) to `maxRows` (6) lines, then scrolls.
- Send submits the trimmed prompt with the selected model and clears the field when uncontrolled. Control it with `value` and `onValueChange`.
- While `loading`, send turns into stop and calls `onStop`.
- `actions` appear behind a + button and `models` in a picker. Both open as a panel that springs up out of the button you tapped, as wide as the composer. Each list is hidden when it's empty.
- `leadingAction` adds your own controls to the toolbar.
- Other `TextInput` props pass through to the field.

## Motion

- Send and stop trade places: the old icon rises 3 points and shrinks away as the new one springs in from below (stiffness 460, damping 30, mass 0.55).
- The + turns 45° while its menu is open.
- Buttons press to 0.93 (stiffness 500, damping 30, mass 0.6).
- Menus grow from 0.86 out of the tapped button on a spring (stiffness 420, damping 40, mass 0.5) and their rows fade down into place 30 ms apart.

## Accessibility

- The field is named "Prompt", and the buttons "Add to prompt", "Model", "Send prompt" and "Stop generating".
- Menus are announced as menus, and the selected model as selected.
- Reduced motion, or `disableAnimation`, swaps icons and opens menus with fades only.

Keep the composer above the keyboard with your app's keyboard handling, such as `KeyboardStickyView` from react-native-keyboard-controller.

Copy this directory, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/render-icon.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icons.
