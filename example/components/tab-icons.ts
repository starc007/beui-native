// Hugeicons for the native iOS tab bar. NativeTabs takes images, not
// components, so each icon is drawn once with Skia into a PNG and handed over
// as a data URI. The tab bar tints it (template rendering), so it's drawn in
// white. Results are cached per icon and size.
import { ImageFormat, Skia } from "@shopify/react-native-skia";
import type { ColorValue, ImageSourcePropType } from "react-native";
import { TAB_ICONS, type TabIconName } from "./app-tabs-data";

export type { TabIconName };

type IconNode = readonly [string, Readonly<Record<string, string | number>>];

// Drawn at 3× so the icon stays sharp on every screen density.
const SCALE = 3;
const cache = new Map<string, ImageSourcePropType | null>();

const kebab = (name: string) =>
  name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

function toSvg(nodes: readonly IconNode[], color: string) {
  const body = nodes
    .map(([tag, attributes]) => {
      const attrs = Object.entries(attributes)
        .filter(([key]) => key !== "key")
        .map(([key, value]) => {
          const resolved = value === "currentColor" ? color : value;
          return `${kebab(key)}="${resolved}"`;
        })
        .join(" ");
      return `<${tag} ${attrs}/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">${body}</svg>`;
}

function render(name: TabIconName, size: number, color: string) {
  const svg = Skia.SVG.MakeFromString(
    toSvg(TAB_ICONS[name] as unknown as readonly IconNode[], color),
  );
  const pixels = Math.round(size * SCALE);
  const surface =
    Skia.Surface.MakeOffscreen(pixels, pixels) ??
    Skia.Surface.Make(pixels, pixels);
  if (!svg || !surface) return null;
  surface.getCanvas().drawSvg(svg, pixels, pixels);
  surface.flush();
  const base64 = surface
    .makeImageSnapshot()
    .encodeToBase64(ImageFormat.PNG, 100);
  return {
    uri: `data:image/png;base64,${base64}`,
    width: size,
    height: size,
    scale: SCALE,
  };
}

/** A VectorIcon family for expo-router's NativeTabs. */
export const hugeiconsTabFamily = {
  async getImageSource(
    name: TabIconName,
    size: number,
    color: ColorValue,
  ): Promise<ImageSourcePropType | null> {
    const key = `${name}:${size}:${String(color)}`;
    if (!cache.has(key)) cache.set(key, render(name, size, String(color)));
    return cache.get(key) ?? null;
  },
};
