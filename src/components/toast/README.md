# Toast

Native port of [beUI Animated Toast Stack](https://beui.dev/components/motion/animated-toast-stack): small pill toasts that stack like notifications, spread out on tap and swipe away.

```tsx
import { Toaster, toast } from "./src";

// Once, after your navigator.
<Toaster topInset={initialWindowMetrics?.insets.top ?? 0} />

toast.success("Changes published");
toast.info("New version available", { description: "Restart to update." });
toast("Message archived", { action: { label: "Undo", onPress: undo } });
toast.promise(upload(), {
  loading: "Uploading photo",
  success: "Photo uploaded",
  error: "Upload failed",
});
```

## API

- `toast(title, options)` shows a toast and returns its id. `toast.success`, `toast.error`, `toast.info` and `toast.loading` set the status.
- Options: `description`, `action` (`{ label, onPress }`), `duration` in milliseconds (0 keeps it up; loading toasts stay up until updated), `dismissible`, and `id` to replace an existing toast.
- `toast.update(id, patch)` changes a toast in place; a new status restarts its timer. `toast.dismiss(id)` removes one, and `toast.dismiss()` removes them all.
- `toast.promise(task, { loading, success, error })` shows one toast that turns from loading into success or error.
- `<Toaster>` takes `position` (`"top"` or `"bottom"`), `topInset` and `bottomInset`, `visibleToasts` (3), `onShow` and `disableAnimation`.

## Look

- A pill on the background color with a hairline border and a soft shadow, hugging its text. A description or action makes it taller; the corner radius stays, so it reads as a rounded card.
- The status sits in a filled circle: the primary color for success and info, red for errors, and a spinner for loading.
- Older toasts wait behind the newest one, shown as solid edges of its shape peeking out.

## Better on a phone

- Tap the stack to spread it into a list, and tap again to fold it.
- Swipe a toast up (or down at the bottom) or sideways to dismiss it. Pulling the other way resists.
- Timers hold while a finger is down or the stack is spread out, so nothing leaves while you read it.
- On iOS toasts draw in their own layer above the window, so they sit over native tab bars and modals; touches outside a toast pass through.
- `onShow` runs for each new toast and status change, with the toast, so you can play a haptic.

## Motion

A toast drops in from the edge as a small circle around its icon, widens into the pill, then shows its text. Leaving plays the same steps in reverse. Only transforms and opacity move: two rounded caps slide apart while the middle stretches between them, so nothing is laid out again mid-motion and the corners never stretch. The stack reflows over 220 ms. A status change crossfades the icon, rolls the title and eases the pill to its new width. With reduced motion, or `disableAnimation`, toasts fade in place.

## Accessibility

VoiceOver announces each new toast and status change. Errors are alerts; other toasts are polite live regions. A dismissible toast hints that it can be swiped.

## Insets

Inside a tab screen, `useSafeAreaInsets` also counts the tab bar, so pass the device's insets: `initialWindowMetrics?.insets` from `react-native-safe-area-context`.

Copy this directory, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/roll-text.tsx`, `primitives/spin-glyph.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icons and `FullWindowOverlay` from `react-native-screens` on iOS.
