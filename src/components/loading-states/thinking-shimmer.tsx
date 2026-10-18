import {
  TextShimmer,
  type TextShimmerProps,
} from "../text-animation/text-shimmer";

export type ThinkingShimmerProps = Omit<TextShimmerProps, "children"> & {
  /** Defaults to "Thinking…". */
  children?: string;
};

/** A highlight sweeping across a muted status line while an agent thinks. */
export function ThinkingShimmer({
  children = "Thinking…",
  duration = 1800,
  className = "",
  ...props
}: ThinkingShimmerProps) {
  return (
    <TextShimmer
      duration={duration}
      className={`text-sm font-medium ${className}`}
      {...props}
    >
      {children}
    </TextShimmer>
  );
}
