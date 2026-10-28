# Morphing Modal

Native port of [beUI Morphing Modal](https://beui.dev/components/motion/morphing-modal), in the style of the Family wallet: one card that rises from the bottom of the screen and springs to the size of each view you open in it.

```tsx
import { MorphingModal, MorphingModalHeader } from "./src";

const [view, setView] = useState<"options" | "details" | null>(null);

<MorphingModal
  view={view}
  onClose={() => setView(null)}
  onBack={view === "details" ? () => setView("options") : undefined}
  bottomInset={insets.bottom}
>
  {view === "options" ? (
    <View>
      <MorphingModalHeader title="Options" />
      <Row label="Details" onPress={() => setView("details")} />
    </View>
  ) : view === "details" ? (
    <View>
      <MorphingModalHeader onBack={() => setView("options")} />
      <Text>…</Text>
    </View>
  ) : null}
</MorphingModal>
```

## Views

- `view` names the view to show; `null` closes the modal. Render the matching content as `children`.
- When `view` changes, the old view fades and lifts away while the new one rises in, and the card springs to the new view's height.
- A view that changes its own size, such as revealing more content, morphs the card too.
- `MorphingModalHeader` puts a title and a close button at the top of a view. Give it `onBack` on views reached from another, and a back button appears before the title.

## Closing

- Swipe the card down, or tap outside it. The backdrop lightens as you pull. `dismissible={false}` keeps it open until a control closes it.
- The Android back button calls `onBack` when you pass it, so it steps back a view before it closes.
- Pass `bottomInset` to keep the card above the home indicator. Inside a tab screen, `useSafeAreaInsets().bottom` also counts the tab bar, which the modal covers, so use the device's inset: `initialWindowMetrics?.insets.bottom` from `react-native-safe-area-context`.

## Better on a phone

- The card floats above the bottom edge with large, continuous corners, and follows your finger when you drag it. Pulling up resists, so it stays anchored.
- Height and content move on the UI thread with Reanimated, so the morph keeps up while JavaScript is busy.

## Accessibility

- The card is a modal for screen readers, named by `accessibilityLabel`, and the leaving view is hidden from them and can't be tapped.
- It shows above the whole window, tab bars included.
- Header buttons are named "Back" and "Close", with touch targets of 44 points.
- Reduced motion, or `disableAnimation`, swaps views with a fade and changes height without motion.

Copy this directory, `hooks/use-presence.ts`, `hooks/use-reduced-motion.ts`, `primitives/agent-icons.tsx`, `primitives/overlay.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`. It uses `react-native-svg` for its icons, and Gesture Handler and Reanimated for the drag and motion. Its overlay uses `FullWindowOverlay` from `react-native-screens` on iOS, so it covers native tab bars.
