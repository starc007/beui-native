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
```

- **Variants:** `pill` (the default), `segment` and `underline`.
- **Indicator:** one indicator per list springs to the selected tab. It uses the web version's spring (stiffness 245, damping 36, mass 1.2), which settles without overshooting the list edges. The first selection appears in place.
- **Label colour:** in the pill and segment variants, each label has a second copy in the on-primary colour, clipped to wherever the indicator overlaps it. During a glide, the colour changes exactly at the indicator's edge, matching the web version's clip-path technique.
- **Overflow:** a list wider than its container scrolls sideways, and selecting a tab scrolls it 16 points clear of the edge. On native, swiping replaces the web version's arrow buttons and faded edges.
- **Content:** `TabsContent` renders only the active panel, fading it in and rising 4 points over 180 ms.
- **State:** pass `value` with `onValueChange` to control it, or `defaultValue` to let it manage itself. `TabsTrigger` accepts `disabled`.
- **Accessibility:** the list reports the `tablist` role, and each trigger reports `tab` with its selected and disabled states. The overlay label copy is hidden from screen readers.
- **Reduced motion:** when the system asks for it, or `disableAnimation` is set on `Tabs`, the indicator jumps to its new tab and content fades without rising.

Triggers must be direct children of `TabsList`, because each trigger measures its own position in the list. Text children are coloured for each state. Other elements, such as icons, render as given.

`indicatorClassName` on `TabsList` overrides the indicator colour.

Copy this directory, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
