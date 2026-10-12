import {
  type ComponentType,
  createElement,
  isValidElement,
  type ReactNode,
} from "react";
import type { ColorValue } from "react-native";

export type IconProps = { size: number; color: ColorValue | undefined };
/** A component receiving `{ size, color }` (such as a lucide icon), or a prebuilt node. */
export type IconSource = ComponentType<IconProps> | ReactNode;

export function renderIcon(icon: IconSource, props: IconProps) {
  if (typeof icon === "function") return createElement(icon, props);
  // forwardRef and memo components (lucide-react-native, for example) are objects.
  if (
    icon != null &&
    typeof icon === "object" &&
    !isValidElement(icon) &&
    "$$typeof" in icon
  ) {
    return createElement(icon as unknown as ComponentType<IconProps>, props);
  }
  return icon;
}
