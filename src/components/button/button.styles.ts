import type { ButtonSize, ButtonVariant } from "./button.types";

export const variants: Record<
  ButtonVariant,
  { container: string; label: string }
> = {
  primary: { container: "bg-primary border-primary", label: "text-on-primary" },
  secondary: {
    container: "bg-surface border-border",
    label: "text-foreground",
  },
  ghost: {
    container: "bg-transparent border-transparent",
    label: "text-foreground",
  },
};

export const sizes: Record<
  ButtonSize,
  { container: string; iconOnly: string; label: string; icon: number }
> = {
  sm: {
    container: "min-h-12 px-3 py-2",
    iconOnly: "h-12 w-12",
    label: "text-sm",
    icon: 18,
  },
  md: {
    container: "min-h-13 px-4 py-3",
    iconOnly: "h-13 w-13",
    label: "text-base",
    icon: 20,
  },
  lg: {
    container: "min-h-14 px-5 py-4",
    iconOnly: "h-14 w-14",
    label: "text-lg",
    icon: 22,
  },
};
