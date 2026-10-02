import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { motion } from "../../styles/motion";
import { sizes, variants } from "./button.styles";
import type { ButtonIcon, ButtonIconProps, ButtonProps } from "./button.types";

function renderIcon(icon: ButtonIcon, props: ButtonIconProps) {
  return typeof icon === "function" ? icon(props) : icon;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  disableAnimation = false,
  disabled = false,
  iconOnly = false,
  icon,
  startIcon,
  endIcon,
  children,
  accessibilityLabel,
  accessibilityState,
  className = "",
  style,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  ref,
  hitSlop,
  ...props
}: ButtonProps) {
  const reducedMotion = useReducedMotionPreference();
  const blocked = disabled || loading;
  const motionDisabled = reducedMotion || disableAnimation;
  const scale = useSharedValue(1);
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const appearance = variants[variant];
  const dimensions = sizes[size];
  const { color } = useResolveClassNames(appearance.label);
  const iconProps = { size: dimensions.icon, color };
  const label =
    loading && loadingLabel ? loadingLabel : (accessibilityLabel ?? children);

  useEffect(() => {
    if (blocked || motionDisabled) {
      cancelAnimation(scale);
      scale.value = 1;
    }
  }, [blocked, motionDisabled, scale]);

  return (
    <Pressable
      {...props}
      ref={ref}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        ...accessibilityState,
        disabled: blocked,
        busy: loading,
      }}
      aria-disabled={blocked}
      aria-busy={loading}
      disabled={blocked}
      hitSlop={hitSlop ?? dimensions.hitSlop}
      className={`min-w-9 self-start items-center justify-center rounded-full border ${appearance.container} ${iconOnly ? dimensions.iconOnly : dimensions.container} ${className}`}
      style={(state) => [
        typeof style === "function" ? style(state) : style,
        { opacity: disabled ? 0.4 : state.pressed && !blocked ? 0.8 : 1 },
      ]}
      onPress={(event) => {
        if (!blocked) onPress?.(event);
      }}
      onLongPress={
        onLongPress
          ? (event) => {
              if (!blocked) onLongPress(event);
            }
          : undefined
      }
      onPressIn={(event) => {
        if (blocked) return;
        if (!motionDisabled) scale.value = withTiming(0.97, motion.press);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, motion.press);
        onPressOut?.(event);
      }}
    >
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden
        className="max-w-full flex-row items-center justify-center gap-2"
        style={[contentStyle, loading && styles.hidden]}
      >
        {iconOnly ? (
          renderIcon(icon, iconProps)
        ) : (
          <>
            {startIcon != null && (
              <View style={styles.icon}>
                {renderIcon(startIcon, iconProps)}
              </View>
            )}
            <Text
              className={`shrink text-center font-medium ${dimensions.label} ${appearance.label}`}
            >
              {children}
            </Text>
            {endIcon != null && (
              <View style={styles.icon}>{renderIcon(endIcon, iconProps)}</View>
            )}
          </>
        )}
      </Animated.View>
      {loading && (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
          style={styles.loader}
        >
          {reducedMotion ? (
            <Text className={`text-lg font-medium ${appearance.label}`}>…</Text>
          ) : (
            <ActivityIndicator size="small" color={color} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hidden: { opacity: 0 },
  icon: { flexShrink: 0 },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
});
