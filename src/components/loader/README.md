# Loader

Native port of [beUI Loader](https://beui.dev/components/motion/loader). Seventeen loading indicators that all scale from one `size`.

```tsx
import { Loader } from "./src";

<Loader />
<Loader variant="dots" size={24} />
<Loader variant="helix" speed={1.4} className="text-primary" />
<Loader variant="ascii-braille" label="Thinking" />
```

**Variants:** `spinner`, `dots`, `bars`, `dot-matrix`, `dither`, `morph`, `comet`, `scramble`, `metaballs`, `newton`, `helix`, `percent`, and the terminal-style `ascii`, `ascii-line`, `ascii-braille`, `ascii-blocks` and `ascii-bounce`.

- **Size and speed:** `size` (32 points by default) sets the square everything scales from. `speed` is seconds per cycle (1 by default), matching the web prop.
- **Color:** the theme's foreground colour by default. Pass a colour utility in `className` (such as `text-primary`) or a `color` value.
- **Motion:** every variant uses the web version's timings, keyframes and stagger on beUI's in-out curve.
- **Accessibility:** the loader is one element with the `progressbar` role and a busy state. `label` ("Loading" by default) is its spoken name.
- **Reduced motion:** when the system asks for it, or `disableAnimation` is set, movement is replaced by a calm opacity pulse. ASCII frames and the percent counter slow down instead of stopping, because they swap content rather than move it. Newton stays still.

The web version draws three variants with SVG. Here they're drawn with Views, so the component needs no SVG library:
- **Spinner:** the arc is the top border of a ring, so its ends are square rather than round.
- **Morph:** cycles through a circle, square, diamond and squircle using corner radius and rotation, rather than morphing SVG paths. It doesn't have the web version's triangle or hexagon.
- **Metaballs:** two dots cross while a blob swells where they meet, standing in for the SVG goo filter.

Copy this directory, `hooks/use-reduced-motion.ts`, `styles/motion.ts`, and the semantic tokens in `styles/theme.css`.
