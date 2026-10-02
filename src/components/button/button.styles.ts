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
  {
    container: string;
    iconOnly: string;
    label: string;
    icon: number;
    hitSlop: number;
  }
> = {
  sm: {
    container: "min-h-9 px-3 py-1.5",
    iconOnly: "h-9 w-9",
    label: "text-sm",
    icon: 16,
    hitSlop: 6,
  },
  md: {
    container: "min-h-10 px-4 py-2",
    iconOnly: "h-10 w-10",
    label: "text-sm",
    icon: 18,
    hitSlop: 4,
  },
  lg: {
    container: "min-h-11 px-5 py-2",
    iconOnly: "h-11 w-11",
    label: "text-base",
    icon: 20,
    hitSlop: 2,
  },
};
