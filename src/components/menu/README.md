# Menu

A pull-down menu: a button that reveals a short list of actions and options, built for touch.

```tsx
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "./src";

<Menu>
  <MenuTrigger accessibilityLabel="More actions">
    <MoreIcon size={20} color={color} />
  </MenuTrigger>
  <MenuContent align="end">
    <MenuItem icon={ShareIcon} onSelect={share}>Share</MenuItem>
    <MenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>Pin to top</MenuCheckboxItem>
    <MenuSeparator />
    <MenuLabel>Sort by</MenuLabel>
    <MenuRadioGroup value={sort} onValueChange={setSort}>
      <MenuRadioItem value="recent">Most recent</MenuRadioItem>
      <MenuRadioItem value="name">Name</MenuRadioItem>
    </MenuRadioGroup>
    <MenuSeparator />
    <MenuItem icon={TrashIcon} destructive onSelect={remove}>Delete</MenuItem>
  </MenuContent>
</Menu>
```

## Parts

- `Menu` holds the open state. Leave it uncontrolled, or control it with `open` and `onOpenChange`.
- `MenuTrigger` wraps your button and toggles the menu.
- `MenuContent` is the panel. `align` lines its `start`, `center` or `end` up with the trigger; `side` is `auto` (below, or above when there isn't room), `top` or `bottom`; `width` defaults to 260.
- `MenuItem` is an action with an optional `icon` and `description`. `destructive` turns it red. It closes the menu unless `closeOnSelect={false}`.
- `MenuCheckboxItem` toggles on and off and stays open, so several can be set in one visit.
- `MenuRadioGroup` with `MenuRadioItem` picks one option, and closes once you choose.
- `MenuLabel` heads a group, and `MenuSeparator` divides groups.
- `useMenu()` gives custom parts the open state and `close()`.

## Motion

- The panel springs out of the point nearest its trigger (stiffness 380, damping 30, mass 0.6), from 55% scale, over a faint scrim. Closing shrinks it back toward the trigger in 150 ms.
- Rows fade down into place 24 ms apart.
- Checks spring in when an option is chosen.

## Better on a phone

Press anywhere on the menu and slide: a highlight glides under your finger from item to item, skipping disabled ones, and letting go chooses, like menus on iOS. A plain tap works too. A menu too tall for the space beside its trigger scrolls instead, and choosing is by tap there.

## Accessibility

- The trigger is a button that reports whether the menu is expanded. Name icon-only triggers with `accessibilityLabel`.
- The panel is a menu. Items are menu items, checkbox items report checked, radio items report checked within their group, and labels are headings. Disabled items say so.
- The Android back button closes it.
- Reduced motion, or `disableAnimation`, opens and closes with fades only.

Copy this directory, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/render-icon.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses Gesture Handler and `react-native-svg`.
