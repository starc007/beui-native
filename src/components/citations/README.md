# Citations

Native port of [beUI Citations](https://beui.dev/components/agents/citations): sources behind an agent's answer, inline and as a list.

```tsx
import { Citation, Citations } from "./src";

<Text>
  Run gestures on the UI thread <Citation item={sources[0]} index={1} />.
</Text>
<Citations citations={sources} defaultOpen />
```

## Parts

- `Citation` is an inline number. Put it inside your text.
- `Citations` is a "Sources" toggle with a count that folds open into the list. Sources rise in as you add them.
- `CitationList` is the list on its own; `CitationStack` shows up to three overlapping favicons; `CitationFavicon` shows one.
- A source has a `title`, an optional `domain` and `url`, and an optional `icon` for things without a favicon, such as files.
- Tapping a source with a `url` opens it with React Native's `Linking`. Pass `onOpenSource` to handle it yourself, such as in an in-app browser.

Favicons load from each site's `/favicon.ico`, the way the web version does, with no third-party service. A globe stands in when a site has none.

## Better on a phone

On the web, a citation number jumps the page down to the source list. On a phone, tapping it springs a card up out of the number with the source's title, domain and an "Open source" button, so you never lose your place in the answer. The card sits above the number when there's room and below it otherwise, and tapping outside closes it.

## Accessibility

- Each number reads as "Citation 2: WAI accessibility patterns". Change it with `label`.
- The toggle reports whether the list is expanded, and rows read as links.
- Reduced motion, or `disableAnimation`, opens the card and the list with fades only.

Copy this directory, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/disclosure.tsx`, `primitives/rise-in.tsx`, `primitives/overlay.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icons. Its overlay uses `FullWindowOverlay` from `react-native-screens` on iOS, so it covers native tab bars.
