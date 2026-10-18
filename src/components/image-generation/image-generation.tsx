import { type ReactNode, useEffect, useState } from "react";
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import {
  AlertGlyph,
  CheckGlyph,
  RetryGlyph,
} from "../../primitives/agent-icons";
import { RollText } from "../../primitives/roll-text";
import { EASE_IN_OUT, EASE_OUT, SPRING_PRESS } from "../../styles/motion";
import { DitherField } from "./dither-field";

export type ImageGenerationStatus =
  | "queued"
  | "generating"
  | "refining"
  | "complete"
  | "error";

const STATUS_TEXT: Record<ImageGenerationStatus, string> = {
  queued: "Waiting to generate",
  generating: "Generating image",
  refining: "Refining details",
  complete: "Image ready",
  error: "Generation failed",
};
// The finished media shows through as the image comes into focus.
const MEDIA: Record<ImageGenerationStatus, { opacity: number; scale: number }> =
  {
    queued: { opacity: 0, scale: 1.02 },
    generating: { opacity: 0, scale: 1.015 },
    refining: { opacity: 0.62, scale: 1.005 },
    complete: { opacity: 1, scale: 1 },
    error: { opacity: 0.28, scale: 1 },
  };
const OVERLAY: Record<ImageGenerationStatus, number> = {
  queued: 1,
  generating: 1,
  refining: 0.48,
  complete: 0,
  error: 0,
};
const SETTLE = { duration: 400, easing: EASE_OUT };

/** A 2×2 glyph that turns while the image generates. */
function Mark({
  status,
  reduce,
  color,
}: {
  status: ImageGenerationStatus;
  reduce: boolean;
  color: unknown;
}) {
  const turn = useSharedValue(0);
  const active = status !== "complete" && status !== "error";
  useEffect(() => {
    if (!active || reduce) {
      cancelAnimation(turn);
      turn.value = 0;
      return;
    }
    turn.value = 0;
    turn.value = withRepeat(
      withTiming(1, {
        duration: 2400,
        easing: EASE_IN_OUT,
        reduceMotion: ReduceMotion.Never,
      }),
      -1,
      false,
    );
    return () => cancelAnimation(turn);
  }, [active, reduce, turn]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 360}deg` }],
  }));
  if (status === "complete")
    return <CheckGlyph size={14} color={color as string} />;
  if (status === "error")
    return <AlertGlyph size={14} color={color as string} />;
  return (
    <Animated.View style={[styles.mark, style]}>
      {[1, 0.55, 0.55, 1].map((opacity, index) => (
        <View
          // Diagonal pairs, so the turn reads at a glance.
          key={`${index}-${opacity}`}
          style={[
            styles.markCell,
            { opacity, backgroundColor: color as string },
          ]}
        />
      ))}
    </Animated.View>
  );
}

export type ImageGenerationProps = Omit<ViewProps, "children"> & {
  /** The finished media, such as an Image. It stays mounted and comes into focus. */
  children?: ReactNode;
  /** Defaults to "generating". */
  status?: ImageGenerationStatus;
  /** Spoken description. Defaults to the status and prompt. */
  label?: string;
  prompt?: string;
  /** A badge in the corner. Defaults to "1024 × 1024". */
  resolution?: string;
  /** Width over height, reserved before the media exists. Defaults to 1. */
  aspectRatio?: number;
  /** "compact" caps the width at 208 points; "fluid" fills. Defaults to "compact". */
  size?: "compact" | "fluid";
  /** Lets a finger steer the placeholder's lens. Defaults to true. */
  interactive?: boolean;
  statusText?: string;
  /** Defaults to true. */
  showStatus?: boolean;
  /** Shows "Try again" after an error. */
  onRetry?: () => void;
  /** Long-press the finished image, such as to save or share it. */
  onLongPress?: PressableProps["onLongPress"];
  className?: string;
  disableAnimation?: boolean;
};

/**
 * An image being generated: a dot lattice with a wandering lens fills the
 * frame, the finished media comes into focus through it, and the status rolls
 * along underneath. Drag across the placeholder and the lens follows.
 */
export function ImageGeneration({
  children,
  status = "generating",
  label,
  prompt,
  resolution = "1024 × 1024",
  aspectRatio = 1,
  size = "compact",
  interactive = true,
  statusText,
  showStatus = true,
  onRetry,
  onLongPress,
  className = "",
  disableAnimation = false,
  ...props
}: ImageGenerationProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const active =
    status === "queued" || status === "generating" || status === "refining";
  const text = statusText ?? STATUS_TEXT[status];
  const spoken = label ?? (prompt ? `${text}: ${prompt}` : text);
  const [ditherMounted, setDitherMounted] = useState(active);
  const mediaOpacity = useSharedValue(MEDIA[status].opacity);
  const mediaScale = useSharedValue(MEDIA[status].scale);
  const overlay = useSharedValue(OVERLAY[status]);
  const lift = useSharedValue(1);
  const retryScale = useSharedValue(1);
  const { color: foreground } = useResolveClassNames("text-foreground");
  const { color: destructive } = useResolveClassNames("text-destructive");

  if (active && !ditherMounted) setDitherMounted(true);
  const unmountDither = () => setDitherMounted(false);

  useEffect(() => {
    const media = MEDIA[status];
    mediaOpacity.value = withTiming(
      media.opacity,
      reduce ? { duration: 0 } : SETTLE,
    );
    mediaScale.value = reduce ? 1 : withTiming(media.scale, SETTLE);
    overlay.value = withTiming(
      OVERLAY[status],
      reduce ? { duration: 0 } : SETTLE,
      (done) => {
        if (done && OVERLAY[status] === 0) scheduleOnRN(unmountDither);
      },
    );
  }, [mediaOpacity, mediaScale, overlay, reduce, status]);

  const mediaStyle = useAnimatedStyle(() => ({
    opacity: mediaOpacity.value,
    transform: [{ scale: mediaScale.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lift.value }],
  }));
  const retryStyle = useAnimatedStyle(() => ({
    transform: [{ scale: retryScale.value }],
  }));

  return (
    <View
      accessibilityState={{ busy: active }}
      className={`w-full ${className}`}
      {...props}
    >
      <View style={size === "compact" ? styles.compact : undefined}>
        <Pressable
          accessibilityRole="image"
          accessibilityLabel={spoken}
          disabled={!onLongPress || status !== "complete"}
          onLongPress={(event) => {
            if (!reduce)
              lift.value = withSequence(
                withSpring(1.03, SPRING_PRESS),
                withSpring(1, SPRING_PRESS),
              );
            onLongPress?.(event);
          }}
        >
          <Animated.View
            style={[{ aspectRatio }, liftStyle]}
            className="w-full overflow-hidden rounded-xl bg-surface"
          >
            <Animated.View
              style={[StyleSheet.absoluteFill, mediaStyle]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {children}
            </Animated.View>
            {ditherMounted ? (
              <Animated.View
                style={[StyleSheet.absoluteFill, overlayStyle]}
                className="bg-surface"
              >
                <DitherField
                  color={String(foreground ?? "#000")}
                  animate={!reduce && active}
                  interactive={interactive && active && !reduce}
                />
              </Animated.View>
            ) : null}
            {resolution ? (
              <View
                pointerEvents="none"
                style={styles.badge}
                className="rounded-full bg-background/75 px-2 py-0.5"
              >
                <Text
                  className="font-mono text-[10px] text-muted"
                  style={styles.tabular}
                >
                  {resolution}
                </Text>
              </View>
            ) : null}
          </Animated.View>
        </Pressable>
        {showStatus || prompt ? (
          <View className="mt-3">
            {showStatus ? (
              <View accessibilityLiveRegion="polite" style={styles.status}>
                <Mark
                  status={status}
                  reduce={reduce}
                  color={status === "error" ? destructive : foreground}
                />
                <RollText
                  text={text}
                  className={`text-sm font-medium ${status === "error" ? "text-destructive" : "text-foreground"}`}
                  reduce={reduce}
                />
              </View>
            ) : null}
            {prompt ? (
              <Text numberOfLines={1} className="mt-0.5 text-xs text-muted">
                “{prompt}”
              </Text>
            ) : null}
          </View>
        ) : null}
        {status === "error" && onRetry ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            onPressIn={() => {
              if (!reduce) retryScale.value = withSpring(0.96, SPRING_PRESS);
            }}
            onPressOut={() => {
              retryScale.value = withSpring(1, SPRING_PRESS);
            }}
          >
            <Animated.View
              style={[styles.retry, retryStyle]}
              className="mt-3 rounded-full px-3"
            >
              <RetryGlyph size={16} color={foreground} />
              <Text className="text-sm font-medium text-foreground">
                Try again
              </Text>
            </Animated.View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { width: "100%", maxWidth: 208, alignSelf: "center" },
  badge: { position: "absolute", top: 8, right: 8 },
  status: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 20 },
  mark: {
    width: 14,
    height: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    padding: 1,
  },
  markCell: { width: 4, height: 4, borderRadius: 1 },
  retry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    alignSelf: "flex-start",
  },
  tabular: { fontVariant: ["tabular-nums"] },
});
