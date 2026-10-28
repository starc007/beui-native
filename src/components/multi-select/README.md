# Multi Select

Native port of [beUI Multi Select](https://beui.dev/components/motion/multi-select). Composable parts for picking several options from a searchable list. Picked options become removable chips that rise in, shrink away, and spring into new places.

```tsx
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectEmpty,
  MultiSelectGroup,
  MultiSelectInput,
  MultiSelectItem,
  MultiSelectLabel,
  MultiSelectList,
  MultiSelectTrigger,
  MultiSelectValue,
} from "./src";

<MultiSelect value={teams} onValueChange={setTeams}>
  <MultiSelectTrigger accessibilityLabel="Teams">
    <MultiSelectValue placeholder="Choose teams" />
  </MultiSelectTrigger>
  <MultiSelectContent>
    <MultiSelectInput accessibilityLabel="Search teams" />
    <MultiSelectList accessibilityLabel="Teams">
      <MultiSelectGroup>
        <MultiSelectLabel>Product teams</MultiSelectLabel>
        <MultiSelectItem value="design">Design</MultiSelectItem>
        <MultiSelectItem value="engineering" keywords={["dev"]}>
          Engineering
        </MultiSelectItem>
      </MultiSelectGroup>
      <MultiSelectEmpty>No teams found.</MultiSelectEmpty>
    </MultiSelectList>
  </MultiSelectContent>
</MultiSelect>
```

## Parts

- **MultiSelect:** owns the state. `value` / `defaultValue` / `onValueChange` for the picked options, `open` / `defaultOpen` / `onOpenChange` for the list, `query` / `defaultQuery` / `onQueryChange` for the search text, and `filter` to replace the default in-order character match. `disabled`, `disableAnimation`.
- **MultiSelectTrigger:** the field. Chips wrap inside it beside a chevron, and a tap anywhere but a chip's X opens or closes the list. Give it an `accessibilityLabel`.
- **MultiSelectValue:** a chip for each picked option, with a remove button. `placeholder` shows while nothing is picked. Pass a function child to render chip labels yourself.
- **MultiSelectContent:** the floating panel. A tap outside it, or Android's back button, closes it.
- **MultiSelectInput:** a search field for the top of the panel. It filters the list as you type, return picks the top match, and Backspace in an empty search removes the last chip.
- **MultiSelectList:** scrolls past 256 points, or sooner when the room beside the field is tight.
- **MultiSelectGroup** and **MultiSelectLabel:** a group hides itself while a query leaves none of its options.
- **MultiSelectItem:** an option, shown as a checkbox row at least 44 points tall. `textValue` labels it when its children aren't a string; `keywords` adds words a query can match; `disabled` dims it.
- **MultiSelectEmpty** and **MultiSelectSeparator.**

## On native

Like the web version, the panel floats over the page beside the field without moving anything. It opens below the field, or above it when the room below is tight and there's more above; the keyboard counts against that room, and the list shortens to fit whatever is left.

The search field lives at the top of the panel rather than in the field: the panel is a modal, and a modal takes focus from inputs behind it. Chip labels stay correct while the panel is closed because MultiSelectContent keeps a hidden copy of the options mounted.

## Motion

The panel grows out of the field and pulls 6 points away on a spring with a light bounce (500 ms, damping ratio 0.78), then folds back over 200 ms. Chips rise 6 points and scale up from 92% as they're picked, shrink out over 160 ms as they're removed, and the rest spring into place on beUI's layout spring. Checks fade and scale in over 140 ms.

With reduced motion, or `disableAnimation`, the panel and chips change at once.

## Accessibility

The field reads as a button with its label, the picked options as its value, and the list's expanded state; the search field reads with its own label; each option as a checkbox with its checked and disabled state, and each chip's remove button as "Remove" and the option's label. Give the input an `accessibilityLabel`.

Copy this directory, `primitives/drawn-path.tsx`, `hooks/use-reduced-motion.ts`, `primitives/overlay.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. Its overlay uses `FullWindowOverlay` from `react-native-screens` on iOS, so it covers native tab bars.
