import type { ReactNode, Ref } from "react";
import type { ColorValue, PressableProps, View } from "react-native";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonIconProps = { size: number; color: ColorValue | undefined };
export type ButtonIcon = ReactNode | ((props: ButtonIconProps) => ReactNode);

type BaseProps = Omit<PressableProps, "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Overrides the spoken label while loading; the visible content keeps its size. */
  loadingLabel?: string;
  /** Disables press motion independently of the system preference. */
  disableAnimation?: boolean;
  ref?: Ref<View>;
};

export type ButtonProps = BaseProps &
  (
    | {
        iconOnly?: false;
        children: string;
        startIcon?: ButtonIcon;
        endIcon?: ButtonIcon;
        icon?: never;
      }
    | {
        iconOnly: true;
        icon: ButtonIcon;
        accessibilityLabel: string;
        children?: never;
        startIcon?: never;
        endIcon?: never;
      }
  );
