# Checkbox

Native port of [beUI Checkbox](https://beui.dev/components/motion/checkbox). A form choice with a checkmark that draws itself in, spring press feedback, and an indeterminate state.

```tsx
import { Checkbox } from "./src";

<Checkbox checked={accepted} onCheckedChange={setAccepted} label="Accept terms and conditions" />
<Checkbox label="Email me updates" description="One message a month." />
<Checkbox checked={all} indeterminate={some} onCheckedChange={toggleAll} label="Select all" />
```

- **Mark:** the checkmark draws itself in over 300 ms, and the indeterminate dash over 200 ms. The mark fades and scales in from 50%. When `indeterminate` turns on or off, the check and the dash crossfade.
- **Colours:** the fill and border fade between the idle and primary colours over 200 ms.
- **Press:** the box springs to 92% on beUI's `SPRING_PRESS` spring.
- **State:** pass `checked` with `onCheckedChange` to control it, or `defaultChecked` to let it manage itself. As on the web, pressing calls `onCheckedChange(!checked)`; an indeterminate checkbox decides what "select all" means through that handler.
- **Label and description:** `label` is the spoken name, and `description` is read as the accessibility hint. The box and text form one touch target, and `hitSlop` tops a 20-point row up to 48 points.
- **Accessibility:** reports the `checkbox` role. An indeterminate checkbox reports a mixed state.
- **Reduced motion:** when the system asks for it, or `disableAnimation` is set, the mark and colours change instantly with no press scale.

The mark is drawn with two rotated Views, matching the web SVG path, so the component needs no SVG library.

Copy this directory, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
