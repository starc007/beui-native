# Select

Native port of [beUI Select](https://beui.dev/components/motion/select). A panel that unfolds out of its trigger: it starts as a thin lip on the trigger's edge, grows to full height, then pulls 8 points away into its own card while the trigger's near corners square off and round back.

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./src";

<Select defaultValue="expo" onValueChange={setFramework}>
  <SelectTrigger accessibilityLabel="Framework">
    <SelectValue placeholder="Choose a framework" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="expo">Expo</SelectItem>
    <SelectItem value="next">Next.js</SelectItem>
    <SelectItem value="legacy" disabled>Legacy</SelectItem>
  </SelectContent>
</Select>
```

## Parts

- **Select:** owns the state. `value` / `defaultValue` / `onValueChange` for the selection, `open` / `defaultOpen` / `onOpenChange` for the panel, `disabled` for the whole control.
- **SelectTrigger:** the field. It's a combobox for screen readers and reports whether it's expanded. Its chevron turns as the panel opens.
- **SelectValue:** the chosen item's label, or `placeholder` in the muted color.
- **SelectContent:** the panel. It renders in a transparent modal at the trigger's position, so it draws over everything and isn't clipped by scroll views. A tap outside it, or Android's back button, closes it.
- **SelectItem:** an option. The selected one gets a drawn check. When its children aren't a plain string, give it a `label` for SelectValue and screen readers.

## Placement and long lists

The panel opens below the trigger, or above it when there isn't room below and there's more above. It's capped at 320 points and scrolls past that.

## Motion

Opening uses a short, barely bouncy spring (300 ms, damping ratio 0.88). Closing folds back over 200 ms with beUI's ease-out. Items fade in as the panel opens. With reduced motion, or `disableAnimation`, the panel appears and disappears without unfolding.

Copy this directory, `primitives/drawn-path.tsx`, `hooks/use-reduced-motion.ts`, `primitives/overlay.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. Its overlay uses `FullWindowOverlay` from `react-native-screens` on iOS, so it covers native tab bars.
