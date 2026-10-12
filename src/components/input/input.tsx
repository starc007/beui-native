import { type Ref, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames, useUniwind } from "uniwind";
import { usePresence } from "../../hooks/use-presence";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { useShake } from "../../hooks/use-shake";
import { DrawnPath, type PathSegment } from "../../primitives/drawn-path";
import { type IconSource, renderIcon } from "../../primitives/render-icon";
import { motion } from "../../styles/motion";

const FIELD_HEIGHT = 44;
const ICON = 16;
const CHECK: PathSegment[] = [
  [5, 12.5, 9.5, 17],
  [9.5, 17, 19, 7.5],
];
const SHAKE = [0, -6, 6, -4, 4, -2, 0];
const COLOR_FADE = { duration: 200, reduceMotion: motion.fade.reduceMotion };
const MESSAGE_FADE = { duration: 200, reduceMotion: motion.fade.reduceMotion };

export type InputClassNames = {
  root?: string;
  label?: string;
  field?: string;
  input?: string;
  errorMessage?: string;
};

export type InputProps = Omit<TextInputProps, "editable"> & {
  label?: string;
  /** A truthy error shakes the field and turns it red. A string also shows a message. */
  error?: string | boolean;
  /** Reserves one message line so validation does not shift content below. */
  reserveErrorLine?: boolean;
  /** Draws a check at the trailing edge in place of `rightIcon`. */
  success?: boolean;
  /** Decorative icon at the leading edge, given `{ size, color }`. */
  leftIcon?: IconSource;
  /** Trailing icon or control, such as a show-password button. */
  rightIcon?: IconSource;
  disabled?: boolean;
  /** Disables shake and transitions independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
  classNames?: InputClassNames;
  ref?: Ref<TextInput>;
};

function ErrorMessage({
  message,
  appear,
  exiting,
  reduce,
  className,
}: {
  message: string;
  appear: boolean;
  exiting: boolean;
  reduce: boolean;
  className: string;
}) {
  const progress = useSharedValue(appear ? 0 : 1);

  useEffect(() => {
    progress.value = withTiming(exiting ? 0 : 1, MESSAGE_FADE);
  }, [exiting, progress]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ translateY: reduce ? 0 : -4 * (1 - progress.value) }],
    }),
    [reduce],
  );

  return (
    <Animated.View
      style={[exiting && styles.exiting, animatedStyle]}
      accessibilityLiveRegion="polite"
    >
      <Text className={`px-1 text-xs text-destructive ${className}`}>
        {message}
      </Text>
    </Animated.View>
  );
}

function SuccessCheck({ reduce }: { reduce: boolean }) {
  const { color } = useResolveClassNames("text-success");
  const draw = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (!reduce) {
      draw.value = withTiming(1, {
        duration: 350,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [draw, reduce]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={styles.trailing}
    >
      <DrawnPath
        segments={CHECK}
        size={20}
        strokeWidth={2.5}
        color={color}
        progress={draw}
      />
    </View>
  );
}

export function Input({
  label,
  error,
  reserveErrorLine = false,
  success = false,
  leftIcon,
  rightIcon,
  disabled = false,
  disableAnimation = false,
  className = "",
  classNames,
  value: valueProp,
  defaultValue,
  onChangeText,
  onFocus,
  onBlur,
  accessibilityLabel,
  accessibilityHint,
  keyboardAppearance,
  style,
  ref,
  ...props
}: InputProps) {
  // Match the keyboard to the app's theme unless the caller chooses one.
  const { theme } = useUniwind();
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const value = valueProp ?? uncontrolled;
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput | null>(null);
  const reducedMotion = useReducedMotionPreference();
  const animate = !reducedMotion && !disableAnimation;

  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" && error ? error : null;
  const state = hasError ? "error" : focused ? "focused" : "idle";

  const { color: foreground } = useResolveClassNames("text-foreground");
  const { color: muted } = useResolveClassNames("text-muted");
  const { color: placeholder } = useResolveClassNames("text-muted/60");
  const { backgroundColor: idleBorder } = useResolveClassNames("bg-border");
  const { backgroundColor: focusBorder } =
    useResolveClassNames("bg-foreground/40");
  const { backgroundColor: focusRing } =
    useResolveClassNames("bg-foreground/10");
  const { backgroundColor: errorBorder } =
    useResolveClassNames("bg-destructive");
  const { backgroundColor: errorRing } =
    useResolveClassNames("bg-destructive/25");

  const borderColor =
    state === "error"
      ? errorBorder
      : state === "focused"
        ? focusBorder
        : idleBorder;
  const ringColor = state === "error" ? errorRing : focusRing;
  const border = useSharedValue(String(borderColor ?? "transparent"));
  const ring = useSharedValue(state === "idle" ? 0 : 1);
  const { shake, style: shakeStyle } = useShake(SHAKE, 450);

  useEffect(() => {
    const next = String(borderColor ?? "transparent");
    border.value = animate ? withTiming(next, COLOR_FADE) : next;
    const target = state === "idle" ? 0 : 1;
    ring.value = animate ? withTiming(target, COLOR_FADE) : target;
  }, [animate, border, borderColor, ring, state]);

  // Shake and announce when an error appears, not while it stays.
  useEffect(() => {
    if (!hasError) return;
    if (animate) shake();
  }, [animate, hasError, shake]);

  useEffect(() => {
    if (errorMessage) AccessibilityInfo.announceForAccessibility(errorMessage);
  }, [errorMessage]);

  const messages = usePresence(
    errorMessage,
    errorMessage ?? "",
    () => MESSAGE_FADE.duration + 40,
  );

  const fieldStyle = useAnimatedStyle(() => ({ borderColor: border.value }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value }));

  const trailing = success ? null : rightIcon;
  const iconProps = { size: ICON, color: muted };

  return (
    <View className={`gap-1.5 ${className} ${classNames?.root ?? ""}`}>
      {label ? (
        <Text
          // The field already carries the label for screen readers.
          accessibilityElementsHidden
          importantForAccessibility="no"
          className={`px-1 text-sm font-medium text-foreground ${classNames?.label ?? ""}`}
          onPress={() => inputRef.current?.focus()}
        >
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={[styles.fieldWrap, disabled && styles.disabled, shakeStyle]}
      >
        <Animated.View
          style={[styles.ring, { borderColor: ringColor }, ringStyle]}
        />
        <Animated.View
          className={`flex-row items-center overflow-hidden rounded-full border ${classNames?.field ?? ""}`}
          style={[styles.field, fieldStyle]}
        >
          {leftIcon != null ? (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              aria-hidden
              style={styles.leading}
            >
              {renderIcon(leftIcon, iconProps)}
            </View>
          ) : null}
          <TextInput
            {...props}
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            value={value}
            editable={!disabled}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityHint={accessibilityHint ?? errorMessage ?? undefined}
            aria-invalid={hasError}
            aria-disabled={disabled}
            placeholderTextColor={placeholder}
            cursorColor={foreground}
            selectionColor={foreground}
            className={`h-full flex-1 text-foreground ${leftIcon != null ? "ps-10" : "ps-3.5"} ${trailing != null || success ? "pe-10" : "pe-3.5"} ${classNames?.input ?? ""}`}
            style={[styles.input, style]}
            keyboardAppearance={keyboardAppearance ?? theme}
            onChangeText={(next) => {
              if (valueProp === undefined) setUncontrolled(next);
              onChangeText?.(next);
            }}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
          />
          {success ? (
            <SuccessCheck reduce={!animate} />
          ) : trailing != null ? (
            <View style={styles.trailingControl}>
              {renderIcon(trailing, iconProps)}
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>

      <View style={reserveErrorLine && styles.reserved}>
        {messages.map((item) =>
          item.value ? (
            <ErrorMessage
              key={item.key}
              message={item.value}
              appear={item.appear}
              exiting={item.exiting}
              reduce={!animate}
              className={classNames?.errorMessage ?? ""}
            />
          ) : null,
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { height: FIELD_HEIGHT },
  disabled: { opacity: 0.6 },
  // A 2-point ring around the border box, like the web's ring-2.
  ring: {
    position: "absolute",
    top: -2,
    bottom: -2,
    left: -2,
    right: -2,
    borderRadius: FIELD_HEIGHT,
    borderWidth: 2,
    pointerEvents: "none",
  },
  field: { height: FIELD_HEIGHT },
  input: {
    // A font size without a line height: a TextInput line height pushes the
    // text and placeholder off center on iOS.
    fontSize: 16,
    paddingVertical: 0,
    // Android centers text vertically only when asked, and adds font padding.
    textAlignVertical: "center",
    includeFontPadding: false,
    // Web inputs draw a focus outline; the field's border and ring replace it.
    ...Platform.select({ web: { outlineWidth: 0 }, default: {} }),
  },
  leading: {
    position: "absolute",
    start: 12,
    pointerEvents: "none",
  },
  trailing: {
    position: "absolute",
    end: 14,
    pointerEvents: "none",
  },
  // A 44-point square keeps trailing controls such as a password toggle tappable.
  trailingControl: {
    position: "absolute",
    end: 0,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  reserved: { minHeight: 16 },
  exiting: { position: "absolute", left: 0, right: 0, top: 0 },
});
