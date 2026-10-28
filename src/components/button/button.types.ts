import type { ReactNode, Ref } from "react";
import type {
  PressableProps,
  StyleProp,
  ViewInstance,
  ViewStyle,
} from "react-native";
import type { IconProps, IconSource } from "../../primitives/render-icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";
export type ButtonIconProps = IconProps;
/** A component receiving `{ size, color }` (such as a lucide icon), or a prebuilt node. */
export type ButtonIcon = IconSource;

export type ButtonBaseProps = Omit<PressableProps, "children" | "style"> & {
  variant?: ButtonVariant;
  /** Scale while pressed. Defaults to 0.93, matching beUI web. */
  pressScale?: number;
  /** Spawn a ripple from the press point. Off by default. */
  ripple?: boolean;
  /** Disables press motion independently of the system preference. */
  disableAnimation?: boolean;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<ViewInstance>;
};

/** Internal props for the shared pressable surface. */
export type ButtonRootProps = ButtonBaseProps & {
  size?: ButtonSize;
  children?: ReactNode;
};

/** Accepts interpolated JSX text such as `Save {count} items`. */
export type ButtonText = string | number | readonly (string | number)[];

export type ButtonProps = ButtonBaseProps &
  (
    | {
        size?: Exclude<ButtonSize, "icon">;
        children: ButtonText;
        startIcon?: ButtonIcon;
        endIcon?: ButtonIcon;
        icon?: never;
      }
    | {
        size: "icon";
        icon: ButtonIcon;
        /** Icon buttons have no visible text, so they need a spoken name. */
        accessibilityLabel: string;
        children?: never;
        startIcon?: never;
        endIcon?: never;
      }
  );

export type ButtonState = "idle" | "loading" | "success" | "error";

export type StatefulButtonProps = ButtonBaseProps & {
  size?: Exclude<ButtonSize, "icon">;
  state?: ButtonState;
  /** The idle label. Latin labels cascade letter by letter; other scripts slide as a whole. */
  children: string;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  /** Trailing icon shown only while idle. */
  icon?: ButtonIcon;
  loadingIcon?: ButtonIcon;
  successIcon?: ButtonIcon;
  errorIcon?: ButtonIcon;
};
