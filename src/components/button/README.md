# Button

A fully rounded native Pressable with primary, secondary, and ghost appearances; sm, md, and lg sizes; disabled and loading states; and reduced-motion-aware press feedback. Every default touch target is at least 48 × 48 points (labeled buttons have a 48-point minimum height).

```tsx
import { Button } from "./src";

<Button onPress={save}>Save changes</Button>
<Button variant="secondary" startIcon={PlusIcon}>Create project</Button>
<Button endIcon={ArrowRightIcon}>Continue</Button>
<Button startIcon={PlusIcon} endIcon={ArrowRightIcon}>Create project</Button>
<Button iconOnly icon={PlusIcon} accessibilityLabel="Create project" />
<Button iconOnly variant="ghost" size="sm" icon={HeartIcon} accessibilityLabel="Save to favorites" />
```

`iconOnly` makes the pill-shaped button circular, independently of `variant`. It requires both `icon` and `accessibilityLabel` in TypeScript. Use a meaningful action label, not the icon's visual name. The label form accepts a string child; icons go in `startIcon` and `endIcon`, which may be used together. Start/end follow the layout direction.

An icon can be a React node or a render function receiving `{ size, color }`. Render functions pick up the button's size and theme automatically. There is no icon-library dependency in the component:

```tsx
<Button startIcon={({ size, color }) => <YourIcon width={size} height={size} color={color} />}>
  Add item
</Button>
```

Use your icon library's own color prop (`color`, `stroke`, etc.). Prebuilt nodes keep the props you supplied. Icon content is decorative and hidden from accessibility services; the button owns the spoken name.

`loading` blocks presses and long presses, reports busy/disabled state, and overlays an indicator while keeping the original content in layout. Supply `loadingLabel="Saving changes"` to change the spoken name. Otherwise the action name is retained. Reduced motion replaces the spinner with a static ellipsis and disables press scaling. `disableAnimation` disables press scaling independently; it does not disable the loading indicator.

The button forwards native Pressable props, handlers, and its ref. Use `style` for container overrides; both a style object and Pressable's state callback are supported. The component owns opacity feedback and accessibility button/disabled/busy semantics. `className` adds container utilities; resolve conflicting utilities via `style` rather than relying on class-string order.

Copy the button directory, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. The host app must configure Uniwind scanning and install React Native, Uniwind, and Reanimated as described in the root README.

Native behavior still needs iOS/Android device validation before a production release, especially VoiceOver/TalkBack, large text, RTL, cancellation while scrolling, and reduced motion changes while the app is open.
