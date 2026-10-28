import {
  Children,
  createContext,
  isValidElement,
  type ReactNode,
  type Ref,
  useContext,
  useEffect,
} from "react";
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type TextProps,
  View,
  type ViewInstance,
  type ViewProps,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { motion } from "../../styles/motion";

export type CardVariant = "outlined" | "muted";
export type CardSize = "default" | "compact";

const CardSizeContext = createContext<CardSize>("default");

const VARIANTS: Record<CardVariant, string> = {
  outlined: "border-border bg-background",
  muted: "border-transparent bg-surface",
};
// The root owns the vertical padding and the gap between parts; each part pads
// itself horizontally, so any part can be left out without others losing edges.
const ROOT_SIZES: Record<CardSize, string> = {
  default: "gap-6 py-6",
  compact: "gap-4 py-4",
};
const INSETS: Record<CardSize, string> = {
  default: "px-6",
  compact: "px-4",
};

const RADIUS = 16;
const PRESS_SCALE = 0.985;
const SELECT_FADE = { duration: 200, reduceMotion: motion.fade.reduceMotion };

export type CardProps = Omit<PressableProps, "children" | "style"> & {
  /** Defaults to "outlined". */
  variant?: CardVariant;
  /** Spacing for every part. Defaults to "default". */
  size?: CardSize;
  /**
   * Makes the whole card one touch target with press feedback. Give it an
   * accessibilityRole that says what pressing does, such as "button" or "checkbox".
   */
  onPress?: PressableProps["onPress"];
  /** Draws the chosen outline and reports the selected state. */
  selected?: boolean;
  /** Disables press motion independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
  style?: ViewProps["style"];
  children?: ReactNode;
  ref?: Ref<ViewInstance>;
};

/** A surface built from parts: CardHeader, CardContent and CardFooter. */
export function Card({
  variant = "outlined",
  size = "default",
  onPress,
  selected = false,
  disableAnimation = false,
  disabled,
  className = "",
  style,
  children,
  accessibilityState,
  onPressIn,
  onPressOut,
  ref,
  ...props
}: CardProps) {
  const reducedMotion = useReducedMotionPreference();
  const animate = !reducedMotion && !disableAnimation;
  const interactive = onPress !== undefined;
  const { backgroundColor: ringColor } = useResolveClassNames("bg-primary");

  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const selection = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    const target = selected ? 1 : 0;
    selection.value = animate ? withTiming(target, SELECT_FADE) : target;
  }, [animate, selected, selection]);

  const pressStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: scale.value }],
      // Without scale, pressing still needs visible feedback.
      opacity: animate ? 1 : 1 - 0.15 * pressed.value,
    }),
    [animate],
  );
  const ringStyle = useAnimatedStyle(() => ({ opacity: selection.value }));

  const surface = `rounded-2xl border ${VARIANTS[variant]} ${ROOT_SIZES[size]} ${disabled ? "opacity-50" : ""} ${className}`;
  const ring = (
    <Animated.View
      style={[styles.ring, { borderColor: ringColor }, ringStyle]}
    />
  );

  if (!interactive) {
    return (
      <CardSizeContext.Provider value={size}>
        <View
          {...(props as ViewProps)}
          ref={ref}
          className={surface}
          style={style}
        >
          {children}
          {ring}
        </View>
      </CardSizeContext.Provider>
    );
  }

  return (
    <CardSizeContext.Provider value={size}>
      <Animated.View style={[styles.pressFrame, pressStyle]}>
        <Pressable
          {...props}
          ref={ref}
          accessible
          disabled={disabled}
          accessibilityState={{
            ...accessibilityState,
            selected,
            disabled: disabled ?? false,
          }}
          className={surface}
          style={style}
          onPress={onPress}
          onPressIn={(event) => {
            pressed.value = 1;
            if (animate) scale.value = withSpring(PRESS_SCALE, motion.press);
            onPressIn?.(event);
          }}
          onPressOut={(event) => {
            pressed.value = 0;
            if (animate) scale.value = withSpring(1, motion.press);
            onPressOut?.(event);
          }}
        >
          {children}
          {ring}
        </Pressable>
      </Animated.View>
    </CardSizeContext.Provider>
  );
}

/**
 * Title and description, with an optional CardAction pinned to the top
 * trailing corner.
 */
export function CardHeader({
  className = "",
  children,
  ...props
}: ViewProps & {
  className?: string;
}) {
  const size = useContext(CardSizeContext);
  const items = Children.toArray(children);
  const actions = items.filter(
    (child) => isValidElement(child) && child.type === CardAction,
  );
  const rest = items.filter((child) => !actions.includes(child));

  return (
    <View
      {...props}
      className={`flex-row items-start gap-4 ${INSETS[size]} ${className}`}
    >
      <View className="flex-1 gap-1.5">{rest}</View>
      {actions}
    </View>
  );
}

export function CardTitle({
  className = "",
  heading = false,
  ...props
}: TextProps & {
  className?: string;
  /** Reports the title as a heading, for cards that start a section. */
  heading?: boolean;
}) {
  return (
    <Text
      {...props}
      accessibilityRole={heading ? "header" : props.accessibilityRole}
      className={`text-[15px] leading-snug font-semibold text-foreground ${className}`}
    />
  );
}

export function CardDescription({
  className = "",
  ...props
}: TextProps & { className?: string }) {
  return (
    <Text
      {...props}
      className={`text-sm leading-relaxed text-muted ${className}`}
    />
  );
}

/** Sits beside the title and description inside CardHeader. */
export function CardAction({
  className = "",
  ...props
}: ViewProps & { className?: string }) {
  return <View {...props} className={`shrink-0 ${className}`} />;
}

export function CardContent({
  className = "",
  ...props
}: ViewProps & { className?: string }) {
  const size = useContext(CardSizeContext);
  return <View {...props} className={`${INSETS[size]} ${className}`} />;
}

export function CardFooter({
  className = "",
  ...props
}: ViewProps & { className?: string }) {
  const size = useContext(CardSizeContext);
  return (
    <View
      {...props}
      className={`flex-row items-center gap-2 ${INSETS[size]} ${className}`}
    />
  );
}

const styles = StyleSheet.create({
  pressFrame: { alignSelf: "stretch" },
  // The selected outline: 1 point over the card's border and 1 point outside
  // it. Offsets count from inside the 1-point border.
  ring: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderRadius: RADIUS + 1,
    pointerEvents: "none",
  },
});
