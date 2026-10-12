# Radio Group

Native port of [beUI Radio Group](https://beui.dev/components/motion/radio). A single-select group whose indicator dot glides to the option you pick.

```tsx
import { RadioGroup, RadioGroupItem } from "./src";

<RadioGroup value={plan} onValueChange={setPlan}>
  <RadioGroupItem value="starter" label="Starter, free" />
  <RadioGroupItem value="pro" label="Pro, $12/mo" description="Unlimited projects." />
  <RadioGroupItem value="legacy" label="Legacy plan" disabled />
</RadioGroup>

<RadioGroup defaultValue="md" orientation="horizontal">…</RadioGroup>
```

- **Glide:** one dot belongs to the group. It springs to the selected ring on beUI's `SPRING_LAYOUT` spring, which replaces the web version's shared `layoutId`. The first selection appears in place without travelling.
- **Press:** the ring springs to 92%. When you press the selected option, the dot presses with it.
- **State:** pass `value` with `onValueChange` to control it, or `defaultValue` to let it manage itself. `orientation` stacks items vertically (the default) or wraps them in a row.
- **Label and description:** `label` is the spoken name, and `description` is read as the accessibility hint. Each item's ring and text form one touch target, and `hitSlop` tops a 20-point row up to 48 points.
- **Accessibility:** the group reports the `radiogroup` role and each item reports `radio` with its checked and disabled states.
- **Reduced motion:** when the system asks for it, or `disableAnimation` is set on the group, the dot and colours change instantly with no press scale.

Items measure their position relative to the group, so they can sit inside your own wrapper views. Each item re-measures when its own layout or the group's layout changes. If an item moves without either of those changing, the dot can be left behind until the next layout.

Copy this directory, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
