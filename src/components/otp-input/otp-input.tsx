import { type Ref, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames, useUniwind } from "uniwind";
import { usePresence } from "../../hooks/use-presence";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { useShake } from "../../hooks/use-shake";
import { DrawnPath, type PathSegment } from "../../primitives/drawn-path";
import { EASE_OUT, motion } from "../../styles/motion";

export type OTPStatus = "idle" | "error" | "success";

const SLOT_WIDTH = 48;
const SLOT_HEIGHT = 56;
const ROLL = 14;
const DIGIT_TIMING = { duration: 220, easing: EASE_OUT };
const COLOR_FADE = { duration: 200, reduceMotion: motion.fade.reduceMotion };
const SHAKE = [0, -5, 5, -3, 3, -1, 0];
const CHECK: PathSegment[] = [
  [5, 13, 9, 17],
  [9, 17, 19, 7],
];
const CHECK_SPRING = { stiffness: 500, damping: 28 };

export type OTPInputProps = Omit<
  TextInputProps,
  | "value"
  | "defaultValue"
  | "onChangeText"
  | "maxLength"
  | "editable"
  | "keyboardType"
  | "secureTextEntry"
> & {
  /** Number of slots. Defaults to 6. */
  length?: number;
  /** Controlled code. Omit it and use `defaultValue` for uncontrolled use. */
  value?: string;
  defaultValue?: string;
  onChangeText?: (value: string) => void;
  /** Fires once every slot is filled. */
  onComplete?: (value: string) => void;
  label?: string;
  /** Helper text below the slots while idle. */
  hint?: string;
  successMessage?: string;
  errorMessage?: string;
  /** Validation feedback: "error" shakes, "success" draws a check. */
  status?: OTPStatus;
  /** Shows dots instead of the typed digits. */
  mask?: boolean;
  disabled?: boolean;
  /** Disables digit, caret and feedback motion independently of the system preference. */
  disableAnimation?: boolean;
  /** Dismisses the keyboard once the last slot fills. */
  blurOnComplete?: boolean;
  className?: string;
  ref?: Ref<TextInputInstance>;
};

function sanitize(raw: string, length: number) {
  return raw.replace(/\D/g, "").slice(0, length);
}

/** Progress runs 0 (below) → 1 (resting) → 2 (rolled out above). */
function Digit({
  char,
  appear,
  exiting,
  reduce,
}: {
  char: string;
  appear: boolean;
  exiting: boolean;
  reduce: boolean;
}) {
  const progress = useSharedValue(appear && !reduce ? 0 : 1);

  useEffect(() => {
    const target = exiting ? 2 : 1;
    progress.value = reduce ? target : withTiming(target, DIGIT_TIMING);
  }, [exiting, progress, reduce]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p <= 1 ? p : 2 - p,
      transform: [{ translateY: (1 - p) * ROLL }],
    };
  });

  return (
    <Animated.View style={[styles.digit, animatedStyle]}>
      <Text
        maxFontSizeMultiplier={1.4}
        className="text-xl font-semibold text-foreground"
        style={styles.tabular}
      >
        {char}
      </Text>
    </Animated.View>
  );
}

function Caret({ filled, reduce }: { filled: boolean; reduce: boolean }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduce) return;
    // On for half a second, off for half, like the web caret.
    opacity.value = withRepeat(
      withSequence(
        withDelay(500, withTiming(0, { duration: 0 })),
        withDelay(500, withTiming(1, { duration: 0 })),
      ),
      -1,
    );
    return () => cancelAnimation(opacity);
  }, [opacity, reduce]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className="bg-foreground"
      style={[styles.caret, filled ? styles.caretEnd : null, animatedStyle]}
    />
  );
}

function Slot({
  char,
  active,
  status,
  mask,
  reduce,
}: {
  char: string;
  active: boolean;
  status: OTPStatus;
  mask: boolean;
  reduce: boolean;
}) {
  const { backgroundColor: idle } = useResolveClassNames("bg-border");
  const { backgroundColor: filled } = useResolveClassNames("bg-border-strong");
  const { backgroundColor: focus } = useResolveClassNames("bg-foreground");
  const { backgroundColor: error } = useResolveClassNames("bg-destructive/60");
  const { backgroundColor: success } = useResolveClassNames("bg-success/60");

  const color =
    status === "success"
      ? success
      : status === "error"
        ? error
        : active
          ? focus
          : char
            ? filled
            : idle;
  const border = useSharedValue(String(color ?? "transparent"));

  useEffect(() => {
    const next = String(color ?? "transparent");
    border.value = reduce ? next : withTiming(next, COLOR_FADE);
  }, [border, color, reduce]);

  const digits = usePresence(
    char ? char : null,
    char,
    () => DIGIT_TIMING.duration + 40,
  );
  const borderStyle = useAnimatedStyle(() => ({ borderColor: border.value }));

  return (
    <Animated.View style={[styles.slot, borderStyle]}>
      {active && status !== "success" ? (
        <Caret filled={char !== ""} reduce={reduce} />
      ) : null}
      {digits.map((item) => (
        <Digit
          key={item.key}
          char={mask ? "•" : item.value}
          appear={item.appear}
          exiting={item.exiting}
          reduce={reduce}
        />
      ))}
    </Animated.View>
  );
}

function SuccessCheck({
  appear,
  exiting,
  reduce,
}: {
  appear: boolean;
  exiting: boolean;
  reduce: boolean;
}) {
  const { color } = useResolveClassNames("text-success");
  const presence = useSharedValue(appear && !reduce ? 0 : 1);
  const draw = useSharedValue(appear && !reduce ? 0 : 1);

  useEffect(() => {
    const target = exiting ? 0 : 1;
    if (reduce) {
      presence.value = target;
      draw.value = 1;
      return;
    }
    presence.value = withSpring(target, CHECK_SPRING);
    if (!exiting) {
      draw.value = withDelay(
        100,
        withTiming(1, { duration: 350, easing: EASE_OUT }),
      );
    }
  }, [draw, exiting, presence, reduce]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, presence.value),
    transform: [{ scale: 0.6 + 0.4 * presence.value }],
  }));

  return (
    <Animated.View style={[styles.check, animatedStyle]}>
      <DrawnPath
        segments={CHECK}
        size={20}
        strokeWidth={3}
        color={color}
        progress={draw}
      />
    </Animated.View>
  );
}

export function OTPInput({
  length = 6,
  value: valueProp,
  defaultValue = "",
  onChangeText,
  onComplete,
  label,
  hint,
  successMessage,
  errorMessage,
  status = "idle",
  mask = false,
  disabled = false,
  disableAnimation = false,
  className = "",
  accessibilityLabel,
  onFocus,
  onBlur,
  blurOnComplete = false,
  keyboardAppearance,
  ref,
  ...props
}: OTPInputProps) {
  const { theme } = useUniwind();
  const inputRef = useRef<TextInputInstance | null>(null);
  // Blur once the filled value and caret have rendered; applying them can
  // otherwise take focus straight back.
  const pendingBlur = useRef(false);
  const [uncontrolled, setUncontrolled] = useState(() =>
    sanitize(defaultValue, length),
  );
  const code = sanitize(valueProp ?? uncontrolled, length);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotionPreference();
  const animate = !reducedMotion && !disableAnimation;
  const { shake, style: shakeStyle } = useShake(SHAKE, 450, EASE_OUT);
  const previousStatus = useRef(status);

  useEffect(() => {
    if (!pendingBlur.current || code.length < length) return;
    pendingBlur.current = false;
    inputRef.current?.blur();
  }, [code, length]);

  const active = Math.min(code.length, length - 1);
  const message =
    status === "success"
      ? successMessage
      : status === "error"
        ? errorMessage
        : hint;

  useEffect(() => {
    if (previousStatus.current === status) return;
    previousStatus.current = status;
    if (status === "error" && animate) shake();
    if (status !== "idle" && message) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [animate, message, shake, status]);

  const checks = usePresence(
    status === "success" ? "success" : null,
    true,
    () => 300,
  );

  return (
    <View className={`self-start gap-2 ${className}`}>
      {label ? (
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no"
          className="text-sm font-medium text-foreground"
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        // Focus on any tap across the slots, even one the field misses.
        accessible={false}
        disabled={disabled}
        onPress={() => inputRef.current?.focus()}
        style={disabled && styles.disabled}
      >
        <Animated.View
          className="flex-row items-center gap-2"
          style={shakeStyle}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Array.from({ length }, (_, index) => (
            <Slot
              // Fixed-length slot grid that never reorders.
              key={index}
              char={code[index] ?? ""}
              active={focused && index === active}
              status={status}
              mask={mask}
              reduce={!animate}
            />
          ))}
        </Animated.View>

        {checks.map((item) => (
          <SuccessCheck
            key={item.key}
            appear={item.appear}
            exiting={item.exiting}
            reduce={!animate}
          />
        ))}

        {/* A transparent field over the slots owns focus, the keyboard, paste
            and SMS autofill. The slots only draw what it holds. */}
        <TextInput
          {...props}
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          // Match the keyboard to the app's theme unless the caller chooses one.
          keyboardAppearance={keyboardAppearance ?? theme}
          value={code}
          editable={!disabled}
          maxLength={length}
          keyboardType="number-pad"
          inputMode="numeric"
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
          caretHidden
          // Nothing of the native field shows; the slots draw everything.
          selectionColor="transparent"
          underlineColorAndroid="transparent"
          contextMenuHidden={false}
          // Keep the native caret at the end so edits always append or delete last.
          selection={{ start: code.length, end: code.length }}
          accessibilityLabel={
            accessibilityLabel ?? label ?? "One-time passcode"
          }
          accessibilityHint={message}
          aria-invalid={status === "error"}
          aria-disabled={disabled}
          style={styles.capture}
          onChangeText={(raw) => {
            const next = sanitize(raw, length);
            if (next === code) return;
            const completed = code.length < length && next.length === length;
            // Set before notifying: a parent update can render synchronously.
            if (completed && blurOnComplete) pendingBlur.current = true;
            if (valueProp === undefined) setUncontrolled(next);
            onChangeText?.(next);
            if (completed) onComplete?.(next);
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
      </Pressable>

      {message ? (
        <Text
          accessibilityLiveRegion="polite"
          className={`text-sm ${status === "success" ? "text-success" : status === "error" ? "text-destructive" : "text-muted"}`}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
  slot: {
    width: SLOT_WIDTH,
    height: SLOT_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  digit: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  tabular: { fontVariant: ["tabular-nums"] },
  caret: { position: "absolute", width: 1, height: 24 },
  caretEnd: { right: 12 },
  check: {
    position: "absolute",
    right: -28,
    top: (SLOT_HEIGHT - 20) / 2,
    pointerEvents: "none",
  },
  capture: {
    ...StyleSheet.absoluteFill,
    // iOS skips views below 0.01 opacity when hit-testing, so a fully
    // transparent field never receives the tap that opens the keyboard.
    opacity: 0.011,
    color: "transparent",
    backgroundColor: "transparent",
  },
});
