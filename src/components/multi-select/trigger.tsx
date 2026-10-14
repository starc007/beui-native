import { type ReactNode, useContext, useEffect } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import Animated, {
  Keyframe,
  LayoutAnimationConfig,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { DrawnPath, type PathSegment } from "../../primitives/drawn-path";
import { EASE_OUT, SPRING_LAYOUT, SPRING_SWAP } from "../../styles/motion";
import { RegistryContext, useMultiSelectContext } from "./context";

const CHEVRON: PathSegment[] = [
  [6, 9, 12, 15],
  [12, 15, 18, 9],
];
const REMOVE: PathSegment[] = [
  [18, 6, 6, 18],
  [6, 6, 18, 18],
];
const SEARCH: PathSegment[] = [[16, 16, 21, 21]];

// A picked chip rises into place; a removed one shrinks away while the rest
// spring to their new spots.
const CHIP_IN = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 6 }, { scale: 0.92 }] },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
    easing: EASE_OUT,
  },
}).duration(220);
const CHIP_OUT = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  100: { opacity: 0, transform: [{ scale: 0.86 }], easing: EASE_OUT },
}).duration(160);
const CHIP_MOVE = LinearTransition.springify()
  .stiffness(SPRING_LAYOUT.stiffness)
  .damping(SPRING_LAYOUT.damping)
  .mass(SPRING_LAYOUT.mass);

export type MultiSelectTriggerProps = {
  children: ReactNode;
  /** Names the field for screen readers, such as "Teams". */
  accessibilityLabel?: string;
  className?: string;
};

/** The field: picked chips wrap inside it. Tapping it opens the list. */
export function MultiSelectTrigger({
  children,
  accessibilityLabel,
  className = "",
}: MultiSelectTriggerProps) {
  const context = useMultiSelectContext("MultiSelectTrigger");
  const { color: muted } = useResolveClassNames("text-muted");
  const turn = useSharedValue(context.open ? 1 : 0);
  const drawn = useSharedValue(1);
  const { measure, open } = context;

  useEffect(() => {
    const target = context.open ? 1 : 0;
    turn.value = context.reduce ? target : withSpring(target, SPRING_SWAP);
  }, [context.open, context.reduce, turn]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 180}deg` }],
  }));

  const summary =
    context.values.length === 0
      ? undefined
      : context.values.map((value) => context.labelFor(value)).join(", ");

  return (
    <View
      ref={context.triggerRef}
      collapsable={false}
      // Chips can change the field's height while the panel is open.
      onLayout={() => {
        if (open) measure();
      }}
      className={`min-h-11 w-full flex-row items-center gap-2 rounded-xl border bg-background py-1.5 pr-1 pl-2.5 ${context.open ? "border-border-strong" : "border-border"} ${context.disabled ? "opacity-50" : ""} ${className}`}
    >
      {/* Covers the field, so a tap anywhere but a chip's X opens the list. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={context.open ? undefined : "Shows the options"}
        accessibilityValue={summary ? { text: summary } : undefined}
        accessibilityState={{
          expanded: context.open,
          disabled: context.disabled,
        }}
        disabled={context.disabled}
        onPress={() => context.setOpen(!context.open)}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="box-none"
        className="min-w-0 flex-1 flex-row flex-wrap items-center gap-1.5"
      >
        {children}
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.chevron, chevronStyle]}
      >
        <DrawnPath
          segments={CHEVRON}
          size={16}
          strokeWidth={2}
          color={muted}
          progress={drawn}
        />
      </Animated.View>
    </View>
  );
}

export type MultiSelectValueProps = {
  /** Shown while nothing is picked. */
  placeholder?: string;
  /** Renders a chip's label. Defaults to the option's label. */
  children?: (value: string, label: string) => ReactNode;
  chipClassName?: string;
};

/** A removable chip for each picked option. */
export function MultiSelectValue({
  placeholder = "Select options",
  children,
  chipClassName = "",
}: MultiSelectValueProps) {
  const context = useMultiSelectContext("MultiSelectValue");
  const { color: muted } = useResolveClassNames("text-muted");
  const drawn = useSharedValue(1);

  if (context.values.length === 0) {
    return (
      <Text
        pointerEvents="none"
        numberOfLines={1}
        className="py-1 text-sm text-muted"
      >
        {placeholder}
      </Text>
    );
  }

  return (
    // Chips already picked on the first render appear without animating in.
    <LayoutAnimationConfig skipEntering>
      {context.values.map((value) => {
        const label = context.labelFor(value);
        return (
          <Animated.View
            key={value}
            // Taps on the label fall through to the field and open the list;
            // only the X is a button of its own.
            pointerEvents="box-none"
            entering={context.reduce ? undefined : CHIP_IN}
            exiting={context.reduce ? undefined : CHIP_OUT}
            layout={context.reduce ? undefined : CHIP_MOVE}
            className={`h-7 max-w-full flex-row items-center gap-1 rounded-lg bg-surface pr-1 pl-2 ${chipClassName}`}
          >
            <View pointerEvents="none" className="shrink">
              {children ? (
                children(value, label)
              ) : (
                <Text
                  numberOfLines={1}
                  className="text-xs font-medium text-foreground"
                >
                  {label}
                </Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${label}`}
              disabled={context.disabled}
              hitSlop={8}
              onPress={() => context.remove(value)}
              className="size-5 items-center justify-center rounded-md active:bg-foreground/10"
            >
              <DrawnPath
                segments={REMOVE}
                size={12}
                strokeWidth={2.2}
                color={muted}
                progress={drawn}
              />
            </Pressable>
          </Animated.View>
        );
      })}
    </LayoutAnimationConfig>
  );
}

export type MultiSelectInputProps = Omit<
  TextInputProps,
  "value" | "defaultValue" | "onChangeText"
> & {
  onChangeText?: (text: string) => void;
};

/**
 * A search field for the top of MultiSelectContent. Typing filters the list,
 * return picks the top match, and Backspace in an empty field removes the
 * last chip.
 */
export function MultiSelectInput({
  accessibilityLabel = "Search options",
  placeholder = "Search…",
  onChangeText,
  onKeyPress,
  onSubmitEditing,
  style,
  ...props
}: MultiSelectInputProps) {
  const registering = useContext(RegistryContext);
  const context = useMultiSelectContext("MultiSelectInput");
  const { color: foreground } = useResolveClassNames("text-foreground");
  const { color: muted } = useResolveClassNames("text-muted");
  const drawn = useSharedValue(1);

  if (registering) return null;

  return (
    <View className="flex-row items-center gap-2 border-b border-border px-3">
      <View pointerEvents="none" style={styles.searchIcon}>
        <View style={[styles.lens, { borderColor: muted }]} />
        <View style={StyleSheet.absoluteFill}>
          <DrawnPath
            segments={SEARCH}
            size={14}
            strokeWidth={2.4}
            color={muted}
            progress={drawn}
          />
        </View>
      </View>
      <TextInput
        {...props}
        ref={context.inputRef}
        accessibilityLabel={accessibilityLabel}
        editable={!context.disabled}
        value={context.query}
        placeholder={placeholder}
        placeholderTextColor={muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        submitBehavior="submit"
        onChangeText={(text) => {
          context.setQuery(text);
          onChangeText?.(text);
        }}
        onKeyPress={(event) => {
          onKeyPress?.(event);
          if (
            event.nativeEvent.key === "Backspace" &&
            !context.query &&
            context.values.length > 0
          ) {
            context.remove(context.values[context.values.length - 1] ?? "");
          }
        }}
        onSubmitEditing={(event) => {
          onSubmitEditing?.(event);
          if (context.query && context.firstMatch) {
            context.toggle(context.firstMatch);
          }
        }}
        style={[styles.input, { color: foreground }, WEB_NO_OUTLINE, style]}
      />
    </View>
  );
}

// Web draws a focus outline around inputs; the panel already frames this one.
// React Native's types don't list "none", but React Native Web passes it on.
const WEB_NO_OUTLINE =
  Platform.OS === "web" ? { outlineStyle: "none" as "solid" } : null;

const styles = StyleSheet.create({
  chevron: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIcon: { width: 14, height: 14 },
  lens: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.4,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
});
