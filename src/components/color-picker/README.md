# Color Picker

Native port of [beUI Color Picker](https://beui.dev/components/motion/color-picker), built for touch. The trigger's color chip grows into a saturation and brightness area, a loupe lifts above your finger while you drag, and hue and opacity sliders, hex, RGB and HSL fields, and presets complete it.

```tsx
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerHexInput,
  ColorPickerHue,
  ColorPickerPreset,
  ColorPickerPresets,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from "./src";

<ColorPicker value={color} onValueChange={setColor} onValueCommit={save}>
  <ColorPickerTrigger />
  <ColorPickerContent accessibilityLabel="Brand color">
    <ColorPickerArea />
    <ColorPickerHue />
    <ColorPickerAlpha />
    <View className="flex-row gap-1.5">
      <ColorPickerHexInput />
      <ColorPickerSwatch />
    </View>
    <ColorPickerPresets accessibilityLabel="Presets">
      <ColorPickerPreset value="#3478f6" label="Blue" />
      <ColorPickerPreset value="#e55656" label="Red" />
    </ColorPickerPresets>
  </ColorPickerContent>
</ColorPicker>
```

## Parts

- **ColorPicker:** owns the color. `value` / `defaultValue` (hex, defaults to `#3478f6`) / `onValueChange` (every change, such as each step of a drag) / `onValueCommit` (when a change settles: a drag ends, a field is submitted, a preset is picked). `alpha` allows translucent colors and defaults to true. `open` / `defaultOpen` / `onOpenChange`, `disabled`, `disableAnimation`.
- **ColorPickerTrigger:** a chip and the hex. Its chip is what grows into the area.
- **ColorPickerContent:** the floating panel, below the trigger unless there's more room above. A tap outside, or Android's back button, closes it.
- **ColorPickerArea:** saturation and brightness. A finger down jumps the thumb there; dragging moves it.
- **ColorPickerHue** and **ColorPickerAlpha:** sliders with a tall touch area around the thin track. The opacity slider renders nothing when `alpha` is off.
- **ColorPickerHexInput:** updates live once six or eight digits are in, and shakes and reverts if what's left on submit isn't a color.
- **ColorPickerChannels:** numeric `rgb` or `hsl` fields, plus opacity when alpha is on.
- **ColorPickerSwatch:** the current color over a transparency checkerboard.
- **ColorPickerPresets** and **ColorPickerPreset:** swatches; a ring marks the one matching the current color.
- **useColorPicker():** the color as HSVA, RGBA and hex, with `update`, `commit`, `open` and `setOpen`, for custom parts. The color helpers `parseHex`, `formatHex`, `hsvaToRgba` and `rgbaToHsva` are exported too.

The parts also work inline, without a trigger: put the area and sliders straight inside `ColorPicker`.

## Motion

One spring (500 ms, damping ratio 0.8, matching the web version's morph) drives opening, and the same motion plays back to close. The trigger's chip grows out of its socket into the area's exact frame, then fades as the real area appears under it; the panel fades in and its rows drop in one after another on the same progress.

While a finger is on the area or a slider, the thumb follows it directly on the UI thread and tucks in, and a teardrop loupe lifts above it with a little overshoot, showing the color under the finger and swinging with the drag's speed. It drops when the finger lifts. When the color changes from elsewhere, the thumbs glide there on beUI's glide spring. The preset ring hops between swatches over a low arc, higher for longer jumps.

While a field is focused, the panel lifts clear of the keyboard.

The web version blurs rows as they arrive and has an eye dropper; React Native has no cheap blur and phones have no system color sampler, so rows fade and drop instead and there's no eye dropper. With reduced motion, or `disableAnimation`, the panel fades in place, thumbs jump, and there's no loupe.

## Accessibility

The area is an adjustable control: swipe up and down to change saturation, with Brighter and Darker as extra actions, and it reads both values. The sliders are adjustable too, with their own names and values. Presets read their color's name and whether they're selected. Fields have labels. Give the trigger an `accessibilityLabel` that names the color's purpose.

For haptics, call your haptics library from `onValueCommit`, as the showcase does with expo-haptics.

Copy this directory, `hooks/use-reduced-motion.ts`, `hooks/use-shake.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
