import {
  type ComponentType,
  createContext,
  createElement,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type ColorValue,
  Pressable,
  StyleSheet,
  Text,
  type TextProps,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { EASE_OUT, motion } from "../../styles/motion";
import { sizes, variants } from "./button.styles";
import type {
  ButtonIconProps,
  ButtonIcon as ButtonIconType,
  ButtonProps,
  ButtonRootProps,
  ButtonSize,
  ButtonVariant,
} from "./button.types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const HOVER_SCALE = 1.02;
const RIPPLE_DURATION = 1600;

type ButtonContextValue = {
  variant: ButtonVariant;
  size: ButtonSize;
  color: ColorValue | undefined;
};

const ButtonContext = createContext<ButtonContextValue | null>(null);

/** Internal: size, variant and resolved foreground color of the enclosing button. */
export function useButtonContext() {
  const context = useContext(ButtonContext);
  if (!context) throw new Error("Button content must be rendered in a Button.");
  return context;
}

export function renderButtonIcon(icon: ButtonIconType, props: ButtonIconProps) {
  if (typeof icon === "function") return createElement(icon, props);
  // forwardRef and memo components (lucide-react-native, for example) are objects.
  if (
    icon != null &&
    typeof icon === "object" &&
    !isValidElement(icon) &&
    "$$typeof" in icon
  ) {
    return createElement(
      icon as unknown as ComponentType<ButtonIconProps>,
      props,
    );
  }
  return icon;
}

function ButtonLabel({ className = "", ...props }: TextProps) {
  const { variant, size } = useButtonContext();
  return (
    <Text
      {...props}
      className={`shrink text-center font-medium ${sizes[size].label} ${variants[variant].label} ${className}`}
    />
  );
}

function ButtonIcon({ icon }: { icon: ButtonIconType }) {
  const { size, color } = useButtonContext();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={styles.icon}
    >
      {renderButtonIcon(icon, { size: sizes[size].icon, color })}
    </View>
  );
}

type Ripple = { id: number; x: number; y: number; size: number };

function RippleDot({ ripple, color }: { ripple: Ripple; color: ColorValue }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: RIPPLE_DURATION,
      easing: EASE_OUT,
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 * (1 - progress.value),
    transform: [{ scale: 0.05 + 0.95 * progress.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          left: ripple.x - ripple.size / 2,
          top: ripple.y - ripple.size / 2,
          width: ripple.size,
          height: ripple.size,
          borderRadius: ripple.size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

/** Internal: the pressable surface, rendering arbitrary content. */
export function ButtonRoot({
  variant = "primary",
  size = "md",
  pressScale = 0.93,
  ripple = false,
  disableAnimation = false,
  disabled: disabledProp,
  children,
  className = "",
  style,
  hitSlop,
  accessibilityState,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  ref,
  ...props
}: ButtonRootProps) {
  const disabled = disabledProp ?? false;
  const reducedMotion = useReducedMotionPreference();
  const animate = !reducedMotion && !disableAnimation;
  const appearance = variants[variant];
  const dimensions = sizes[size];
  const { color } = useResolveClassNames(appearance.label);

  const scale = useSharedValue(1);
  const pressed = useSharedValue(false);
  const hovered = useSharedValue(false);
  const layout = useRef({ width: 0, height: 0 });
  const nextRippleId = useRef(0);
  const rippleTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    const timers = rippleTimers.current;
    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!animate || disabled) scale.value = 1;
  }, [animate, disabled, scale]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: scale.value }],
      // Without scale, pressing still needs visible feedback.
      opacity: disabled ? 0.5 : !animate && pressed.value ? 0.7 : 1,
    }),
    [animate, disabled],
  );

  const restScale = () => (hovered.value ? HOVER_SCALE : 1);

  return (
    <ButtonContext.Provider value={{ variant, size, color }}>
      <AnimatedPressable
        {...props}
        ref={ref}
        accessible
        accessibilityRole="button"
        accessibilityState={{ ...accessibilityState, disabled }}
        aria-disabled={disabled}
        disabled={disabled}
        hitSlop={hitSlop ?? dimensions.hitSlop}
        className={`self-start flex-row items-center justify-center border ${appearance.container} ${dimensions.container} ${dimensions.radius} ${className}`}
        style={[style, animatedStyle]}
        onPressIn={(event) => {
          pressed.value = true;
          if (animate) scale.value = withSpring(pressScale, motion.press);
          if (ripple && animate && color) {
            const { locationX, locationY } = event.nativeEvent;
            const { width, height } = layout.current;
            const id = nextRippleId.current++;
            setRipples((current) => [
              ...current,
              {
                id,
                x: locationX,
                y: locationY,
                size: Math.max(width, height) * 2,
              },
            ]);
            const timer = setTimeout(() => {
              rippleTimers.current.delete(timer);
              setRipples((current) => current.filter((r) => r.id !== id));
            }, RIPPLE_DURATION);
            rippleTimers.current.add(timer);
          }
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          pressed.value = false;
          if (animate) scale.value = withSpring(restScale(), motion.press);
          onPressOut?.(event);
        }}
        onHoverIn={(event) => {
          hovered.value = true;
          if (animate && !pressed.value) {
            scale.value = withSpring(HOVER_SCALE, motion.press);
          }
          onHoverIn?.(event);
        }}
        onHoverOut={(event) => {
          hovered.value = false;
          if (animate && !pressed.value) {
            scale.value = withSpring(1, motion.press);
          }
          onHoverOut?.(event);
        }}
      >
        {ripple && (
          <View
            className={`absolute inset-0 overflow-hidden ${dimensions.radius}`}
            style={styles.passThrough}
            onLayout={({ nativeEvent }) => {
              layout.current = nativeEvent.layout;
            }}
          >
            {color != null &&
              ripples.map((item) => (
                <RippleDot key={item.id} ripple={item} color={color} />
              ))}
          </View>
        )}
        {children}
      </AnimatedPressable>
    </ButtonContext.Provider>
  );
}

export function Button(props: ButtonProps) {
  if (props.size === "icon") {
    const { icon, ...rest } = props;
    return (
      <ButtonRoot {...rest}>
        <ButtonIcon icon={icon} />
      </ButtonRoot>
    );
  }
  const { startIcon, endIcon, children, ...rest } = props;
  const label = Array.isArray(children) ? children.join("") : String(children);
  return (
    <ButtonRoot {...rest}>
      {startIcon != null && <ButtonIcon icon={startIcon} />}
      <ButtonLabel>{label}</ButtonLabel>
      {endIcon != null && <ButtonIcon icon={endIcon} />}
    </ButtonRoot>
  );
}

const styles = StyleSheet.create({
  icon: { flexShrink: 0 },
  passThrough: { pointerEvents: "none" },
  ripple: { position: "absolute" },
});
