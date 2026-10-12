import { useEffect, useRef } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { usePresence } from "../../hooks/use-presence";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { CascadeText } from "../../primitives/cascade-text";
import { motion } from "../../styles/motion";
import { ButtonRoot, renderButtonIcon, useButtonContext } from "./button";
import { sizes, variants } from "./button.styles";
import type {
  ButtonIcon,
  ButtonState,
  StatefulButtonProps,
} from "./button.types";
import { CheckIcon, CrossIcon, Spinner } from "./status-icons";

function IconSlot({
  icon,
  appear,
  exiting,
  side,
  reduce,
}: {
  icon: ButtonIcon;
  appear: boolean;
  exiting: boolean;
  side: "start" | "end";
  reduce: boolean;
}) {
  const { size, color } = useButtonContext();
  const { icon: iconSize, gap } = sizes[size];
  const slot = iconSize + gap;
  const progress = useSharedValue(appear ? 0 : 1);

  useEffect(() => {
    progress.value = reduce
      ? withTiming(exiting ? 0 : 1, motion.fade)
      : exiting
        ? withTiming(0, motion.exit)
        : withSpring(1, motion.swap);
  }, [exiting, progress, reduce]);

  const slotStyle = useAnimatedStyle(
    () => ({
      // Width collapses with the icon so the row never pops in a single frame.
      width: reduce ? (exiting ? 0 : slot) : Math.max(0, slot * progress.value),
    }),
    [exiting, reduce, slot],
  );
  const iconStyle = useAnimatedStyle(
    () => ({
      opacity: Math.min(1, Math.max(0, progress.value)),
      transform: [{ scale: reduce ? 1 : 0.7 + 0.3 * progress.value }],
    }),
    [reduce],
  );

  return (
    <Animated.View
      style={[
        styles.iconSlot,
        side === "start" ? styles.alignStart : styles.alignEnd,
        slotStyle,
      ]}
    >
      <Animated.View style={iconStyle}>
        {renderButtonIcon(icon, { size: iconSize, color })}
      </Animated.View>
    </Animated.View>
  );
}

function StatefulContent({
  state,
  text,
  icon,
  statusIcons,
}: {
  state: ButtonState;
  text: string;
  icon: ButtonIcon | undefined;
  statusIcons: Record<Exclude<ButtonState, "idle">, ButtonIcon>;
}) {
  const reduce = useReducedMotionPreference();
  const { size, variant } = useButtonContext();
  const leading = usePresence(
    state === "idle" ? null : state,
    state,
    () => motion.exit.duration + 40,
  );
  const trailing = usePresence(
    state === "idle" && icon != null ? "idle" : null,
    icon,
    () => motion.exit.duration + 40,
  );

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.content}
    >
      {leading.map((item) =>
        item.value === "idle" ? null : (
          <IconSlot
            key={item.key}
            icon={statusIcons[item.value]}
            appear={item.appear}
            exiting={item.exiting}
            side="start"
            reduce={reduce}
          />
        ),
      )}
      <CascadeText
        textKey={`${state}-${text}`}
        text={text}
        className={`font-medium ${sizes[size].label} ${variants[variant].label}`}
        reduce={reduce}
      />
      {trailing.map((item) => (
        <IconSlot
          key={item.key}
          icon={item.value}
          appear={item.appear}
          exiting={item.exiting}
          side="end"
          reduce={reduce}
        />
      ))}
    </View>
  );
}

export function StatefulButton({
  state = "idle",
  children,
  loadingText = "Loading",
  successText = "Done",
  errorText = "Try again",
  icon,
  loadingIcon = Spinner,
  successIcon = CheckIcon,
  errorIcon = CrossIcon,
  disabled,
  accessibilityLabel,
  accessibilityState,
  ...props
}: StatefulButtonProps) {
  const busy = state === "loading";
  const text =
    state === "loading"
      ? loadingText
      : state === "success"
        ? successText
        : state === "error"
          ? errorText
          : children;
  const previousState = useRef(state);

  // The button keeps focus while its name changes, so announce status changes explicitly.
  useEffect(() => {
    if (previousState.current === state) return;
    previousState.current = state;
    if (state !== "idle") AccessibilityInfo.announceForAccessibility(text);
  }, [state, text]);

  return (
    <ButtonRoot
      {...props}
      disabled={disabled || busy}
      accessibilityLabel={accessibilityLabel ?? text}
      accessibilityState={{ ...accessibilityState, busy }}
      aria-busy={busy}
    >
      <StatefulContent
        state={state}
        text={text}
        icon={icon}
        statusIcons={{
          loading: loadingIcon,
          success: successIcon,
          error: errorIcon,
        }}
      />
    </ButtonRoot>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  iconSlot: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  alignStart: { justifyContent: "flex-start" },
  alignEnd: { justifyContent: "flex-end" },
});
