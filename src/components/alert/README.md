# Alert

Native port of [beUI Animated Alert](https://beui.dev/components/motion/alert). Composable feedback that eases in, blends between variants, and folds away when dismissed.

```tsx
import {
  Alert,
  AlertAction,
  AlertClose,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "./src";

<Alert variant="destructive" open={open} onOpenChange={setOpen}>
  <AlertIcon />
  <AlertContent>
    <AlertTitle>Something went wrong</AlertTitle>
    <AlertDescription>We couldn't save your changes.</AlertDescription>
    <AlertAction>
      <Button size="sm" variant="outline" onPress={retry}>Try again</Button>
    </AlertAction>
  </AlertContent>
  <AlertClose />
</Alert>
```

## Parts

- **Alert:** the surface. `variant` is `default`, `info`, `success`, `warning` or `destructive`, each from the semantic tokens. `open` / `defaultOpen` / `onOpenChange` control visibility; it starts open. `contentClassName` styles the inner row.
- **AlertIcon:** the variant's icon. Pass children to replace it.
- **AlertContent:** stacks the title, description and actions, and takes the free width.
- **AlertTitle:** takes the variant's color. **AlertDescription:** muted supporting text.
- **AlertAction:** a row for buttons.
- **AlertClose:** a 32-point X button (44 with its hit slop) that dismisses the alert after running your `onPress`.
- **useAlert():** `open`, `variant`, `setOpen` and `dismiss`, for custom parts.

## Motion

Opening fades in over 180 ms and drops 6 points into place over 200 ms, both on beUI's ease-out, while the space it needs springs open. Closing fades and lifts over 120 ms as the space folds away over 220 ms, so whatever sits below glides up instead of jumping. That fold is a native addition; the web version leaves the space to its container.

Changing variant blends the surface color over 200 ms, swaps the icon with a 4-point rise and slight scale, and springs the height to fit new content.

With reduced motion, or `disableAnimation`, the alert fades without moving and its space opens and closes at once.

## Accessibility

Warning and destructive alerts are announced as alerts and interrupt; the others are polite live regions. A closed alert is hidden from screen readers while it folds away. Override either with `accessibilityRole` or `accessibilityLiveRegion`.

Copy this directory, `primitives/drawn-path.tsx`, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
