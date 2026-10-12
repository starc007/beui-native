# Card

Native port of [beUI Card](https://beui.dev/components/motion/card). A surface built from parts, with an optional pressable, selectable state.

```tsx
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./src";

<Card>
  <CardHeader>
    <CardTitle heading>Review order</CardTitle>
    <CardDescription>Check the details before you confirm.</CardDescription>
    <CardAction>
      <Button variant="ghost" size="sm">Edit</Button>
    </CardAction>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter className="justify-end">
    <Button size="sm">Confirm order</Button>
  </CardFooter>
</Card>
```

## Parts

- **Card:** the surface. `variant` is `outlined` (border on the page background, the default) or `muted` (a filled surface). `size` is `default` (24-point padding and gaps) or `compact` (16 points).
- **CardHeader:** stacks a title and description, and pins any `CardAction` child to the top trailing corner.
- **CardTitle** and **CardDescription:** the heading and supporting text. `heading` reports the title as a heading for screen readers.
- **CardContent** and **CardFooter:** the body, and a row for actions.

The card owns the vertical padding and the gap between parts. Each part pads itself horizontally, so any part can be left out, and media can run edge to edge: give the card `className="overflow-hidden pt-0"` and put an image first.

## Pressable and selectable cards

Give `Card` an `onPress` and the whole card becomes one touch target. Pressing sinks it to 98.5% on beUI's press spring. With reduced motion, or `disableAnimation`, pressing dims it instead.

`selected` fades in a 2-point primary outline over 200 ms and reports the selected state. For a card that acts as a checkbox or radio, let the card own the state and describe it:

```tsx
<Card
  selected={checked}
  onPress={() => setChecked(!checked)}
  accessibilityRole="checkbox"
  accessibilityState={{ checked }}
  accessibilityLabel="Signed contract"
>
  <CardHeader>
    <CardTitle>Signed contract</CardTitle>
    <CardAction style={{ pointerEvents: "none" }} importantForAccessibility="no-hide-descendants">
      <Checkbox checked={checked} />
    </CardAction>
  </CardHeader>
</Card>
```

The control inside then only shows the state, so it shouldn't respond to touches or be read separately. That replaces the web version's stretched-target class: on native, the whole card is the touch target.

Copy this directory, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
