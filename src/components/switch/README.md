# Switch

Native port of [beUI Switch](https://beui.dev/components/motion/switch). A toggle with a heavy spring-driven thumb and press feedback.

```tsx
import { Switch } from "./src";

<Switch checked={enabled} onCheckedChange={setEnabled} label="Enable notifications" />
<Switch defaultChecked label="Uncontrolled" />
<Switch accessibilityLabel="Airplane mode" />
```

- **Motion:** the thumb travels on the web version's heavy spring (stiffness 800, damping 80, mass 4), so it feels weighty without wobbling. The track colour fades between `bg-muted/60` and `bg-primary` over 200 ms.
- **Press:** while pressed, the thumb shrinks to 90% and stretches 4 points toward where it is going.
- **Disabled:** dims to 60% opacity and ignores presses. On iOS and Android, pressing a disabled switch gives the thumb a small shake. On web the shake is skipped, because react-native-web needs the real `disabled` prop to report the disabled state.
- **State:** pass `checked` with `onCheckedChange` to control it, or `defaultChecked` to let it manage itself.
- **Label:** `label` renders text beside the track. The track and label form one touch target, and the label becomes the spoken name. Without a label, pass `accessibilityLabel`.
- **Accessibility:** reports the `switch` role with its checked and disabled states. `hitSlop` tops the 28-point track up to a 48-point touch area.
- **RTL:** the thumb starts and travels from the leading edge.
- **Reduced motion:** when the system asks for it, or `disableAnimation` is set, the thumb and colour change instantly with no press squish or shake.

The web Switch only responds to taps, and so does this one. Native platform switches can also be dragged; that may come later with Gesture Handler.

Copy this directory, `hooks/use-reduced-motion.ts`, and the semantic tokens in `styles/theme.css`.
