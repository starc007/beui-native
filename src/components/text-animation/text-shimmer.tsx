import { useEffect } from "react";
import { View, type ViewProps } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  ReduceMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { GlyphRow } from "../../primitives/glyph-row";

// The web gradient is twice the text's width with its highlight 40% either side
// of its middle, swept from 200% to -200% background position. In text widths
// that is a highlight 0.4 wide whose center travels from -1 to 3.
const BAND = 0.4;
const SWEEP_FROM = -1;
const SWEEP_TO = 3;

export type TextShimmerProps = Omit<ViewProps, "children"> & {
  children: string;
  /** One sweep in milliseconds. Defaults to 2500. */
  duration?: number;
  /** Text style, such as `text-xl font-semibold`. Colors come from the theme. */
  className?: string;
  /** Disables the sweep independently of the system preference. */
  disableAnimation?: boolean;
};

/** A highlight that sweeps across muted text, for loading and thinking states. */
export function TextShimmer({
  children,
  duration = 2500,
  className = "",
  disableAnimation = false,
  accessibilityLabel,
  ...props
}: TextShimmerProps) {
  const reducedMotion = useReducedMotionPreference();
  const animate = !reducedMotion && !disableAnimation;
  const { color: base } = useResolveClassNames("text-muted");
  const { color: highlight } = useResolveClassNames("text-foreground");
  const progress = useSharedValue(0);
  const baseColor = String(base ?? "gray");
  const highlightColor = String(highlight ?? "black");

  useEffect(() => {
    if (!animate) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      }),
      -1,
    );
    return () => cancelAnimation(progress);
  }, [animate, duration, progress]);

  const colorAt = (p: number, position: number) => {
    "worklet";
    const center = SWEEP_FROM + (SWEEP_TO - SWEEP_FROM) * p;
    const lit = Math.max(0, 1 - Math.abs(position - center) / BAND);
    return {
      color: interpolateColor(lit, [0, 1], [baseColor, highlightColor]),
      opacity: 1,
    };
  };

  return (
    <View
      {...props}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? children}
      style={[{ alignSelf: "flex-start" }, props.style]}
    >
      {animate ? (
        <GlyphRow
          text={children}
          className={className}
          progress={progress}
          colorAt={colorAt}
        />
      ) : (
        <Animated.Text className={className} style={{ color: baseColor }}>
          {children}
        </Animated.Text>
      )}
    </View>
  );
}
