import type { ButtonSize, ButtonVariant } from "./button.types";

// Class strings stay literal so Uniwind can discover them.

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
    label: "text-muted",
  },
  outline: {
    container: "bg-transparent border-border",
    label: "text-foreground",
  },
};

/**
 * Visible heights match beUI web (32, 40, 48). `hitSlop` tops the touch area up
 * to 48 points; content may grow taller for larger text.
 */
export const sizes: Record<
  ButtonSize,
  {
    container: string;
    radius: string;
    label: string;
    icon: number;
    gap: number;
    hitSlop: number;
  }
> = {
  sm: {
    container: "min-h-8 px-3 py-1 gap-1.5",
    radius: "rounded-full",
    label: "text-xs",
    icon: 14,
    gap: 6,
    hitSlop: 8,
  },
  md: {
    container: "min-h-10 px-5 py-2 gap-2",
    radius: "rounded-full",
    label: "text-sm",
    icon: 16,
    gap: 8,
    hitSlop: 4,
  },
  lg: {
    container: "min-h-12 px-6 py-2 gap-2",
    radius: "rounded-full",
    label: "text-base",
    icon: 18,
    gap: 8,
    hitSlop: 0,
  },
  icon: {
    container: "h-8 w-8",
    radius: "rounded-lg",
    label: "text-sm",
    icon: 16,
    gap: 0,
    hitSlop: 8,
  },
};
