import { type ReactNode, type Ref, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { usePresence } from "../../hooks/use-presence";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import {
  ArrowUpGlyph,
  CrossGlyph,
  MicGlyph,
  PlusGlyph,
  StopGlyph,
} from "../../primitives/agent-icons";
import { type IconSource, renderIcon } from "../../primitives/render-icon";
import { RiseIn } from "../../primitives/rise-in";
import { SPRING_LAYOUT, SPRING_PRESS, SPRING_SWAP } from "../../styles/motion";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "../menu/menu";

export type PromptModel = {
  value: string;
  label: string;
  description?: string;
  icon?: IconSource;
  disabled?: boolean;
};

export type PromptAction = {
  value: string;
  label: string;
  description?: string;
  icon?: IconSource;
  disabled?: boolean;
};

export type PromptAttachment = {
  id: string;
  label: string;
  /** A thumbnail or file icon. */
  icon?: IconSource;
};

const LINE_HEIGHT = 22;
const FIELD_PADDING = 8;
const BUTTON = 36;
const SURFACE_PADDING = 6;
const INLINE_INSET = 6;
const WIDE_INSET = 10;
const GLIDE = LinearTransition.springify()
  .stiffness(SPRING_LAYOUT.stiffness)
  .damping(SPRING_LAYOUT.damping)
  .mass(SPRING_LAYOUT.mass);

/** Progress runs 0 (arriving) → 1 (resting) → 2 (leaving), with a small scale. */
function SwapIcon({
  appear,
  exiting,
  reduce,
  children,
}: {
  appear: boolean;
  exiting: boolean;
  reduce: boolean;
  children: ReactNode;
}) {
  const progress = useSharedValue(appear && !reduce ? 0 : 1);
  useEffect(() => {
    const target = exiting ? 2 : 1;
    progress.value = reduce ? target : withSpring(target, SPRING_SWAP);
  }, [exiting, progress, reduce]);
  const style = useAnimatedStyle(() => {
    const away = Math.abs(1 - progress.value);
    return {
      opacity: Math.max(0, 1 - away),
      transform: reduce ? [] : [{ scale: 1 - away * 0.4 }],
    };
  }, [reduce]);
  return (
    <Animated.View style={[styles.layer, style]}>{children}</Animated.View>
  );
}

function RoundButton({
  label,
  disabled,
  onPress,
  className,
  reduce,
  children,
}: {
  label: string;
  disabled?: boolean;
  onPress?: () => void;
  className: string;
  reduce: boolean;
  children: ReactNode;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      onPressIn={() => {
        if (!reduce) scale.value = withSpring(0.9, SPRING_PRESS);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_PRESS);
      }}
    >
      <Animated.View style={[styles.round, style]} className={className}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

function AttachmentChip({
  attachment,
  reduce,
  onRemove,
}: {
  attachment: PromptAttachment;
  reduce: boolean;
  onRemove?: (id: string) => void;
}) {
  const { color: muted } = useResolveClassNames("text-muted");
  return (
    <RiseIn reduce={reduce}>
      <View
        className="h-9 flex-row items-center gap-2 rounded-xl bg-background pl-2.5 pr-1.5"
        style={styles.chip}
      >
        {attachment.icon
          ? renderIcon(attachment.icon, { size: 16, color: muted })
          : null}
        <Text
          numberOfLines={1}
          className="max-w-40 text-[13px] text-foreground"
        >
          {attachment.label}
        </Text>
        {onRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${attachment.label}`}
            hitSlop={8}
            onPress={() => onRemove(attachment.id)}
            className="size-6 items-center justify-center rounded-full active:bg-surface"
          >
            <CrossGlyph size={12} color={muted} />
          </Pressable>
        ) : null}
      </View>
    </RiseIn>
  );
}

export type PromptInputProps = Omit<
  TextInputProps,
  "value" | "defaultValue" | "onChangeText" | "onSubmitEditing" | "children"
> & {
  value?: string;
  /** Defaults to "". */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Models to choose from, listed in the + menu. */
  models?: PromptModel[];
  model?: string;
  /** Defaults to the first model. */
  defaultModel?: string;
  onModelChange?: (model: string) => void;
  /** Things to add to the prompt, listed in the + menu. */
  actions?: PromptAction[];
  onAction?: (action: string) => void;
  /** Files and images added to the prompt, shown as chips above the text. */
  attachments?: PromptAttachment[];
  onRemoveAttachment?: (id: string) => void;
  /** Shows a mic while the field is empty, such as to start dictation or voice mode. */
  onVoice?: () => void;
  /** Called with the trimmed prompt and the selected model. Clears the field when uncontrolled. */
  onSubmit?: (value: string, model?: string) => void | Promise<void>;
  /** While true, the send button becomes a stop button. */
  loading?: boolean;
  onStop?: () => void;
  /** Puts the last prompt back in an empty field when you stop a reply. Defaults to true. */
  restoreOnStop?: boolean;
  /** Lines the field grows to before scrolling. Defaults to 6. */
  maxRows?: number;
  /** Extra controls beside the + button once the composer opens up. */
  leadingAction?: ReactNode;
  disabled?: boolean;
  /** Classes for the composer surface. */
  className?: string;
  disableAnimation?: boolean;
  ref?: Ref<TextInputInstance>;
};

/**
 * A chat composer in the style of ChatGPT: a soft pill with a + menu, the
 * field, and a mic that turns into a send arrow as you type. When the text
 * wraps, the pill opens into a card with the buttons in a row underneath.
 * Attachments ride above the text as removable chips.
 */
export function PromptInput({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  models = [],
  model: controlledModel,
  defaultModel,
  onModelChange,
  actions = [],
  onAction,
  attachments = [],
  onRemoveAttachment,
  onVoice,
  onSubmit,
  loading = false,
  onStop,
  restoreOnStop = true,
  maxRows = 6,
  leadingAction,
  disabled = false,
  className = "",
  disableAnimation = false,
  placeholder = "Ask anything",
  accessibilityLabel = "Prompt",
  ref,
  ...inputProps
}: PromptInputProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const [internalModel, setInternalModel] = useState(
    defaultModel ?? models[0]?.value,
  );
  const model = controlledModel ?? internalModel;
  const [width, setWidth] = useState(0);
  // Wrapped heights of the text at the pill's field width and at full width,
  // measured off-screen so the layout never feeds back into its own choice.
  const [inlineHeight, setInlineHeight] = useState(LINE_HEIGHT);
  const [wideHeight, setWideHeight] = useState(LINE_HEIGHT);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastPrompt = useRef("");
  const turn = useSharedValue(0);
  const plusScale = useSharedValue(1);
  const { color: onPrimary } = useResolveClassNames("text-on-primary");
  const { color: foreground } = useResolveClassNames("text-foreground");
  const { color: muted } = useResolveClassNames("text-muted");

  const trimmed = value.trim();
  const canSubmit =
    (trimmed.length > 0 || attachments.length > 0) && !disabled && !loading;
  const hasMenu = actions.length > 0 || models.length > 0;
  // One line sits in the pill; a second line opens it into a card.
  const multiline = inlineHeight > LINE_HEIGHT * 1.5;
  const expanded = multiline || attachments.length > 0;
  const contentHeight = expanded ? wideHeight : inlineHeight;
  const fieldHeight = Math.min(
    maxRows * LINE_HEIGHT,
    Math.max(LINE_HEIGHT, contentHeight),
  );
  const inner = Math.max(0, width - SURFACE_PADDING * 2);
  const inlineWidth =
    inner - (hasMenu ? BUTTON : 0) - BUTTON - 4 - INLINE_INSET * 2;
  const wideWidth = inner - WIDE_INSET * 2;
  // A zero-width space keeps a trailing newline's line in the measurement.
  const mirror = `${value}\u200b`;
  const selectedModel = models.find((entry) => entry.value === model);

  useEffect(() => {
    turn.value = reduce
      ? menuOpen
        ? 1
        : 0
      : withSpring(menuOpen ? 1 : 0, SPRING_SWAP);
  }, [menuOpen, reduce, turn]);
  const plusPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: plusScale.value }],
  }));
  const plusStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 45}deg` }],
  }));

  const setValue = (next: string) => {
    if (controlledValue === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  const submit = () => {
    if (!canSubmit) return;
    lastPrompt.current = trimmed;
    void onSubmit?.(trimmed, model);
    if (controlledValue === undefined) setInternalValue("");
  };

  const stop = () => {
    onStop?.();
    if (restoreOnStop && value.trim() === "" && lastPrompt.current)
      setValue(lastPrompt.current);
  };

  // The trailing button: stop while loading, send once there's something to
  // send, otherwise the mic when there's a voice handler.
  const trailing: "stop" | "send" | "voice" = loading
    ? "stop"
    : canSubmit || !onVoice
      ? "send"
      : "voice";
  const trailingIcons = usePresence(trailing, trailing, () =>
    reduce ? 0 : 240,
  );
  const filled = trailing === "stop" || (trailing === "send" && canSubmit);

  const plus = hasMenu ? (
    <Animated.View layout={reduce ? undefined : GLIDE}>
      <Menu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        disableAnimation={disableAnimation}
      >
        <MenuTrigger
          accessibilityLabel={
            selectedModel
              ? `Add to prompt, model ${selectedModel.label}`
              : "Add to prompt"
          }
          disabled={disabled}
          onPressIn={() => {
            if (!reduce) plusScale.value = withSpring(0.9, SPRING_PRESS);
          }}
          onPressOut={() => {
            plusScale.value = withSpring(1, SPRING_PRESS);
          }}
        >
          <Animated.View
            style={[styles.round, plusPressStyle]}
            className={menuOpen ? "bg-foreground/10" : ""}
          >
            <Animated.View style={plusStyle}>
              <PlusGlyph size={20} color={foreground} strokeWidth={1.8} />
            </Animated.View>
          </Animated.View>
        </MenuTrigger>
        <MenuContent align="start">
          {actions.map((action) => (
            <MenuItem
              key={action.value}
              icon={action.icon}
              description={action.description}
              disabled={action.disabled}
              onSelect={() => onAction?.(action.value)}
            >
              {action.label}
            </MenuItem>
          ))}
          {actions.length > 0 && models.length > 0 ? <MenuSeparator /> : null}
          {models.length > 0 ? (
            <>
              <MenuLabel>Model</MenuLabel>
              <MenuRadioGroup
                value={model}
                onValueChange={(next) => {
                  if (controlledModel === undefined) setInternalModel(next);
                  onModelChange?.(next);
                }}
              >
                {models.map((entry) => (
                  <MenuRadioItem
                    key={entry.value}
                    value={entry.value}
                    icon={entry.icon}
                    description={entry.description}
                    disabled={entry.disabled}
                  >
                    {entry.label}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </>
          ) : null}
        </MenuContent>
      </Menu>
    </Animated.View>
  ) : null;

  const send = (
    <Animated.View layout={reduce ? undefined : GLIDE}>
      <RoundButton
        label={
          trailing === "stop"
            ? "Stop generating"
            : trailing === "voice"
              ? "Voice"
              : "Send prompt"
        }
        disabled={
          trailing === "stop"
            ? !onStop
            : trailing === "send"
              ? !canSubmit
              : disabled
        }
        reduce={reduce}
        onPress={
          trailing === "stop" ? stop : trailing === "voice" ? onVoice : submit
        }
        className={
          filled ? "bg-primary" : trailing === "voice" ? "" : "bg-foreground/10"
        }
      >
        {trailingIcons.map((item) => (
          <SwapIcon
            key={item.key}
            appear={item.appear}
            exiting={item.exiting}
            reduce={reduce}
          >
            {item.value === "stop" ? (
              <StopGlyph size={12} color={onPrimary} />
            ) : item.value === "voice" ? (
              <MicGlyph size={20} color={foreground} strokeWidth={1.8} />
            ) : (
              <ArrowUpGlyph
                size={18}
                color={canSubmit ? onPrimary : muted}
                strokeWidth={2.25}
              />
            )}
          </SwapIcon>
        ))}
      </RoundButton>
    </Animated.View>
  );

  const field = (
    <TextInput
      ref={ref}
      multiline
      value={value}
      onChangeText={setValue}
      editable={!disabled}
      placeholder={placeholder}
      accessibilityLabel={accessibilityLabel}
      scrollEnabled={contentHeight > maxRows * LINE_HEIGHT}
      placeholderTextColor={muted}
      cursorColor={foreground}
      selectionColor={foreground}
      className="text-[16px] text-foreground"
      style={[
        styles.field,
        { height: fieldHeight + FIELD_PADDING * 2 },
        expanded ? styles.fieldWide : styles.fieldInline,
      ]}
      {...inputProps}
    />
  );

  return (
    <Animated.View
      layout={reduce ? undefined : GLIDE}
      onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
      style={[styles.surface, expanded ? styles.card : styles.pill]}
      className={`bg-surface ${disabled ? "opacity-60" : ""} ${className}`}
    >
      {attachments.length > 0 ? (
        <View style={styles.attachments}>
          {attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.id}
              attachment={attachment}
              reduce={reduce}
              onRemove={onRemoveAttachment}
            />
          ))}
        </View>
      ) : null}
      {/* The field keeps one place in the tree, so it never loses focus as the shape changes. */}
      <View style={expanded ? undefined : styles.row}>
        {expanded ? null : plus}
        {field}
        {expanded ? null : send}
      </View>
      {expanded ? (
        <Animated.View
          entering={reduce ? undefined : FadeIn.duration(160)}
          style={styles.toolbar}
        >
          {plus}
          {leadingAction}
          <View style={styles.spacer} />
          {send}
        </Animated.View>
      ) : null}
      {width > 0 ? (
        <View
          pointerEvents="none"
          style={styles.mirrors}
          importantForAccessibility="no-hide-descendants"
        >
          <Text
            className="text-[16px]"
            style={[styles.mirror, { width: inlineWidth }]}
            onLayout={({ nativeEvent }) =>
              setInlineHeight(nativeEvent.layout.height)
            }
          >
            {mirror}
          </Text>
          <Text
            className="text-[16px]"
            style={[styles.mirror, { width: wideWidth }]}
            onLayout={({ nativeEvent }) =>
              setWideHeight(nativeEvent.layout.height)
            }
          >
            {mirror}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  surface: { overflow: "hidden", padding: SURFACE_PADDING },
  pill: { borderRadius: 28 },
  card: { borderRadius: 24 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  field: {
    lineHeight: LINE_HEIGHT,
    paddingTop: FIELD_PADDING,
    paddingBottom: FIELD_PADDING,
    textAlignVertical: "top",
  },
  fieldInline: { flex: 1, paddingHorizontal: INLINE_INSET },
  fieldWide: { paddingHorizontal: WIDE_INSET },
  mirrors: { position: "absolute", left: 0, top: 0, opacity: 0 },
  mirror: { position: "absolute", left: 0, top: 0, lineHeight: LINE_HEIGHT },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  spacer: { flex: 1 },
  attachments: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 4,
    paddingBottom: 2,
  },
  chip: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  round: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  layer: { position: "absolute" },
});
