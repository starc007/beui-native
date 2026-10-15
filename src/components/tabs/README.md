# Tabs

Native port of [beUI Tabs](https://beui.dev/components/motion/tabs). Pill, segment or underline tabs with an indicator that springs between them.

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./src";

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
  <TabsContent value="activity">…</TabsContent>
</Tabs>

<Tabs value={range} onValueChange={setRange} variant="segment">…</Tabs>

<Tabs defaultValue="feed" icons="selected">
  <TabsList>
    <TabsTrigger value="feed" icon={BellIcon}>Feed</TabsTrigger>
    <TabsTrigger value="profile" icon={UserIcon}>Profile</TabsTrigger>
  </TabsList>
</Tabs>
```

- **Variants:** `pill` (the default), `segment` and `underline`.
- **Indicator:** one indicator per list springs to the selected tab. It uses the web version's spring (stiffness 245, damping 36, mass 1.2), which settles without overshooting the list edges. The first selection appears in place.
- **Label colour:** in the pill and segment variants, each label has a second copy in the on-primary colour, clipped to wherever the indicator overlaps it. During a glide, the colour changes exactly at the indicator's edge, matching the web version's clip-path technique.
- **Icons:** `TabsTrigger` takes an `icon`, a component given `{ size, color }` or a prebuilt node, drawn before the label in the label's colour on both layers. With `icons="selected"` on `Tabs`, only the selected tab carries its icon: it springs open beside the label on `SPRING_SWAP` while the indicator glides over, and folds away on the tab left behind. One progress value drives both label layers, so the on-indicator copy never drifts. The default, `icons="always"`, shows every icon.
- **Overflow:** a list wider than its container scrolls sideways. Each edge with tabs past it fades into the list's background, and selecting a tab scrolls it 32 points clear of the edge so it sits beyond the fade. On native, swiping replaces the web version's arrow buttons. The fades use `experimental_backgroundImage` gradients on iOS and Android, and `backgroundImage` on web.
- **Content:** `TabsContent` renders only the active panel, fading it in and rising 4 points over 180 ms.
- **State:** pass `value` with `onValueChange` to control it, or `defaultValue` to let it manage itself. `TabsTrigger` accepts `disabled`.
- **Accessibility:** the list reports the `tablist` role, and each trigger reports `tab` with its selected and disabled states. The overlay label copy is hidden from screen readers.
- **Reduced motion:** when the system asks for it, or `disableAnimation` is set on `Tabs`, the indicator jumps to its new tab, icons appear and disappear in place, and content fades without rising.

Triggers must be direct children of `TabsList`, because each trigger measures its own position in the list. Text children are coloured for each state. Other elements render as given; pass icons through `icon` so they're coloured too.

`indicatorClassName` on `TabsList` overrides the indicator colour.

Copy this directory, `hooks/use-reduced-motion.ts`, `primitives/render-icon.tsx`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
