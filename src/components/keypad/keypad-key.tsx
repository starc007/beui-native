import type { ReactNode, Ref } from "react";
import {
  Pressable,
  type PressableProps,
  Text,
  View,
  type ViewInstance,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { EASE_OUT, SPRING_PRESS } from "../../styles/motion";
import { KEY_SIZES, useKeypad } from "./keypad-context";

// The backdrop lights at once and lingers a moment after release.
const LIGHT = { duration: 60, easing: EASE_OUT };
const FADE = { duration: 220, easing: EASE_OUT };
const SINK = 0.08;

export type KeypadKeyProps = Omit<PressableProps, "children" | "style"> & {
  /** Sent to the keypad's `onKeyPress`, such as "7", "." or "delete". */
  value: string;
  /** Replaces the default label, such as an icon. */
  children?: ReactNode;
  /** Small text under the label, such as "ABC" on a phone pad. */
  sublabel?: string;
  /** Runs instead of the keypad's `onKeyPress`. */
  onPress?: () => void;
  className?: string;
  ref?: Ref<ViewInstance>;
};

/**
 * One key. Plain keys light a soft backdrop while held; circle keys sit in
 * a ring that sinks a little and brightens. Pressing sends `value` to the
 * keypad's `onKeyPress`, or runs the key's own `onPress`.
 */
export function KeypadKey({
  value,
  children,
  sublabel,
  onPress,
  disabled: keyDisabled,
  accessibilityLabel,
  className = "",
  ref,
  ...props
}: KeypadKeyProps) {
  const {
    onKeyPress,
    variant,
    size,
    disabled: padDisabled,
    reduce,
  } = useKeypad();
  const disabled = padDisabled || !!keyDisabled;
  const dims = KEY_SIZES[variant][size];
  const circle = variant === "circle";
  const pressed = useSharedValue(0);

  const glow = useAnimatedStyle(() => ({ opacity: pressed.value }));
  const sink = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * SINK }],
  }));

  const press = (on: boolean) => {
    if (reduce) pressed.value = on ? 1 : 0;
    else if (circle) pressed.value = withSpring(on ? 1 : 0, SPRING_PRESS);
    else pressed.value = withTiming(on ? 1 : 0, on ? LIGHT : FADE);
  };

  const label = children ?? (
    <>
      <Text className={`font-medium text-foreground ${dims.label}`}>
        {value}
      </Text>
      {sublabel ? (
        <Text className="text-xs font-medium tracking-widest text-muted">
          {sublabel}
        </Text>
      ) : null}
    </>
  );

  return (
    <Pressable
      {...props}
      ref={ref}
      disabled={disabled}
      onPress={() => (onPress ? onPress() : onKeyPress?.(value))}
      onPressIn={(e) => {
        press(true);
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press(false);
        props.onPressOut?.(e);
      }}
      accessibilityRole="keyboardkey"
      accessibilityLabel={accessibilityLabel ?? value}
      accessibilityState={{ disabled }}
      style={[
        circle ? { width: dims.height } : { flex: 1 },
        { height: dims.height, opacity: disabled ? 0.4 : 1 },
      ]}
      className={`items-center justify-center ${className}`}
    >
      {circle ? (
        <Animated.View
          style={[sink, { width: dims.height, height: dims.height }]}
          className="items-center justify-center overflow-hidden rounded-full border border-border bg-surface"
        >
          <Animated.View
            style={glow}
            className="absolute inset-0 bg-border-strong"
          />
          {label}
        </Animated.View>
      ) : (
        <View className="absolute inset-x-1.5 inset-y-0.5">
          <Animated.View
            style={glow}
            className="flex-1 rounded-2xl bg-foreground/10"
          />
        </View>
      )}
      {circle ? null : label}
    </Pressable>
  );
}
