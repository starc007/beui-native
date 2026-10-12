# Button

Native port of [beUI Button](https://beui.dev/components/motion/button). A spring-pressed `Button` plus `StatefulButton`, with the same variants, sizes and motion tokens as the web library.

```tsx
import { Button, StatefulButton } from "./src";

<Button onPress={save}>Save changes</Button>
<Button variant="secondary" startIcon={Plus}>Create project</Button>
<Button endIcon={ArrowRight}>Continue</Button>
<Button size="icon" variant="ghost" icon={Heart} accessibilityLabel="Add to favorites" />

<StatefulButton state={state} loadingText="Saving" successText="Saved" icon={ArrowRight}>
  Save changes
</StatefulButton>
```

## Button

- **Variants:** `primary`, `secondary`, `outline`, `ghost`.
- **Sizes:** `sm`, `md`, `lg` (32, 40 and 48 points tall) and `icon` (32-point square). Default `hitSlop` tops each up to a 48-point touch area. Native hit areas cannot extend past their parent, so leave room around compact buttons. Content can grow taller for larger text.
- **Press:** scales to `pressScale` (0.93 by default) on beUI's `SPRING_PRESS` spring, and springs back on release. With a mouse or trackpad (web, iPad), hovering lifts the button to 1.02.
- **Ripple:** `ripple` sends a soft wave out from the press point. It is off by default.
- **Reduced motion:** when the system asks for reduced motion, or `disableAnimation` is set, scale and ripple turn off and pressing dims the button instead.
- **Disabled:** dims to 50% opacity and reports the disabled state to accessibility services.

The label is the text child; interpolated text such as `<Button>Save {count} items</Button>` works. Icons go in `startIcon` and `endIcon`, which can be used together and follow the layout direction. `size="icon"` takes `icon` instead of a label and requires `accessibilityLabel` in TypeScript.

An icon can be a component that receives `{ size, color }`, such as a `lucide-react-native` icon or your own SVG component, or a prebuilt element. Pass a component defined outside render. An inline arrow function is a new component type on every render, so it remounts each time. Icons receive the button's icon size and foreground color, and are hidden from accessibility services because the button owns the spoken name.

`className` and `style` style the button itself. The button forwards Pressable props, handlers and its ref. Resolve conflicting utilities through `style` rather than class order.

## StatefulButton

`state` takes `idle`, `loading`, `success` or `error`. Text for each state comes from `children`, `loadingText`, `successText` and `errorText`.

- The label rolls letter by letter on `SPRING_SWAP`, and the button's width springs to fit the new text.
- A leading spinner, check or cross grows in beside the label. Replace them with `loadingIcon`, `successIcon` and `errorIcon`.
- The optional trailing `icon` shows only while idle.
- `loading` disables the button and reports busy.
- Each state change is announced to VoiceOver and TalkBack. The accessible name follows the current text unless you pass `accessibilityLabel`.
- Reduced motion swaps the cascade for a short crossfade, and the width changes without animating. The spinner keeps turning, because it shows that work is still in progress.
- Only Latin labels cascade. Splitting a label into letters breaks shaping in Arabic, Devanagari, Thai and other connected scripts, so those labels slide as a whole.

The web version also blurs letters as they move. Native has no cheap blur, so letters use opacity and position only.

## Copying

Copy this directory, `hooks/use-reduced-motion.ts`, `hooks/use-presence.ts`, `primitives/render-icon.tsx`, `primitives/cascade-text.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. The host app needs React Native, Uniwind and Reanimated, set up as described in the root README.

## Validation

Before release, check on iOS and Android devices:

- VoiceOver and TalkBack announcements
- Large text
- RTL layouts
- Presses cancelled by scrolling
- Changing reduced motion while the app is open
