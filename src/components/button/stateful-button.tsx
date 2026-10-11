import { type ReactNode, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { usePresence } from "../../hooks/use-presence";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { motion } from "../../styles/motion";
import { ButtonRoot, renderButtonIcon, useButtonContext } from "./button";
import { sizes, variants } from "./button.styles";
import type {
  ButtonIcon,
  ButtonState,
  StatefulButtonProps,
} from "./button.types";
import { CheckIcon, CrossIcon, Spinner } from "./status-icons";

const CASCADE_STAGGER = 25;
const TEXT_DISTANCE = 14;
// Splitting into letters breaks shaping in connected and complex scripts.
const CASCADE_SAFE = /^[ -~ -ɏ]+$/;

function letters(text: string) {
  // Whitespace-only Text can measure zero-width on Android.
  return Array.from(text.replace(/ /g, " "));
}

function exitDuration(text: string, cascade: boolean) {
  const stagger = cascade ? (text.length - 1) * CASCADE_STAGGER * 0.5 : 0;
  return motion.exit.duration + stagger + 40;
}

/** Progress runs 0 (below) → 1 (resting) → 2 (exited above). */
function Slide({
  appear,
  exiting,
  distance,
  delay,
  reduce,
  children,
}: {
  appear: boolean;
  exiting: boolean;
  distance: number;
  delay: number;
  reduce: boolean;
  children: ReactNode;
}) {
  const progress = useSharedValue(appear ? 0 : 1);

  useEffect(() => {
    if (reduce) {
      progress.value = withTiming(exiting ? 2 : 1, motion.fade);
    } else if (exiting) {
      progress.value = withDelay(delay / 2, withTiming(2, motion.exit));
    } else {
      progress.value = withDelay(delay, withSpring(1, motion.swap));
    }
  }, [delay, exiting, progress, reduce]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: Math.min(1, Math.max(0, p <= 1 ? p : 2 - p)),
      transform: [{ translateY: reduce ? 0 : (1 - p) * distance }],
    };
  }, [distance, reduce]);

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

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

function Label({ text, cascade }: { text: string; cascade: boolean }) {
  const { size, variant } = useButtonContext();
  const className = `font-medium ${sizes[size].label} ${variants[variant].label}`;
  return cascade ? (
    letters(text).map((char, index) => (
      <Text key={index} className={className}>
        {char}
      </Text>
    ))
  ) : (
    <Text numberOfLines={1} className={className}>
      {text}
    </Text>
  );
}

function TextSlot({
  stateKey,
  text,
  reduce,
}: {
  stateKey: string;
  text: string;
  reduce: boolean;
}) {
  const { size, variant } = useButtonContext();
  const canCascade = (value: string) => !reduce && CASCADE_SAFE.test(value);
  const items = usePresence(stateKey, text, (value) =>
    reduce ? motion.fade.duration + 40 : exitDuration(value, canCascade(value)),
  );
  const [measured, setMeasured] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const width = useSharedValue(0);

  const widthStyle = useAnimatedStyle(() => ({ width: width.value }));
  const labelClass = `font-medium ${sizes[size].label} ${variants[variant].label}`;
  const distance = measured ? measured.height * 1.05 : 20;

  return (
    <Animated.View
      style={[
        styles.textSlot,
        measured && { height: measured.height },
        measured && widthStyle,
      ]}
    >
      {/* Measures the incoming label with the same per-letter layout it renders with. */}
      <View style={styles.measureHost}>
        <View
          style={styles.row}
          onLayout={({ nativeEvent: { layout } }) => {
            if (measured) {
              width.value = reduce
                ? layout.width
                : withSpring(layout.width, motion.swap);
            } else {
              width.value = layout.width;
            }
            setMeasured({ width: layout.width, height: layout.height });
          }}
        >
          <Label text={text} cascade={canCascade(text)} />
        </View>
      </View>

      {items.map((item) => {
        const cascade = canCascade(item.value);
        return (
          <View key={item.key} style={[styles.row, measured && styles.layer]}>
            {cascade ? (
              letters(item.value).map((char, index) => (
                <Slide
                  key={index}
                  appear={item.appear}
                  exiting={item.exiting}
                  distance={distance}
                  delay={index * CASCADE_STAGGER}
                  reduce={reduce}
                >
                  <Text className={labelClass}>{char}</Text>
                </Slide>
              ))
            ) : (
              <Slide
                appear={item.appear}
                exiting={item.exiting}
                distance={TEXT_DISTANCE}
                delay={0}
                reduce={reduce}
              >
                <Text numberOfLines={1} className={labelClass}>
                  {item.value}
                </Text>
              </Slide>
            )}
          </View>
        );
      })}
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
      <TextSlot stateKey={`${state}-${text}`} text={text} reduce={reduce} />
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
  textSlot: { overflow: "hidden", flexShrink: 0 },
  row: { flexDirection: "row", alignItems: "center" },
  layer: { position: "absolute", left: 0, top: 0 },
  measureHost: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 10000,
    flexDirection: "row",
    alignItems: "flex-start",
    opacity: 0,
    pointerEvents: "none",
  },
});
