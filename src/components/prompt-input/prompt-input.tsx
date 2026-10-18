import {
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useResolveClassNames } from "uniwind";
import { usePresence } from "../../hooks/use-presence";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import {
  ArrowUpGlyph,
  CheckGlyph,
  ChevronDownGlyph,
  PlusGlyph,
  StopGlyph,
} from "../../primitives/agent-icons";
import { type IconSource, renderIcon } from "../../primitives/render-icon";
import { EASE_OUT, SPRING_PRESS, SPRING_SWAP } from "../../styles/motion";

export type PromptModel = {
  value: string;
  label: string;
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

const LINE_HEIGHT = 24;
// Vertical padding inside the text field.
const FIELD_PADDING = 6;
const MENU_GAP = 8;
const EDGE = 12;
const SPRING_PANEL = {
  stiffness: 420,
  damping: 40,
  mass: 0.5,
  reduceMotion: ReduceMotion.System,
};
const MENU_EXIT = { duration: 160, easing: EASE_OUT };
const ITEM_STAGGER = 30;

type Frame = { x: number; y: number; width: number; height: number };
type MenuItem = {
  value: string;
  label: string;
  description?: string;
  icon?: IconSource;
  disabled?: boolean;
  selected?: boolean;
};

function MenuRow({
  item,
  index,
  open,
  reduce,
  onSelect,
}: {
  item: MenuItem;
  index: number;
  open: boolean;
  reduce: boolean;
  onSelect: (value: string) => void;
}) {
  const shown = useSharedValue(0);
  const { color: foreground } = useResolveClassNames("text-foreground");
  const { color: muted } = useResolveClassNames("text-muted");

  useEffect(() => {
    shown.value = open
      ? withDelay(
          reduce ? 0 : 40 + index * ITEM_STAGGER,
          withTiming(1, { duration: 140, easing: EASE_OUT }),
        )
      : withTiming(0, { duration: 80 });
  }, [index, open, reduce, shown]);

  const style = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: reduce ? 0 : (1 - shown.value) * -4 }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole="menuitem"
        accessibilityState={{
          disabled: item.disabled,
          selected: item.selected,
        }}
        disabled={item.disabled}
        onPress={() => onSelect(item.value)}
        className={`min-h-11 flex-row items-center gap-3 rounded-xl px-3 py-2 active:bg-surface ${item.disabled ? "opacity-40" : ""}`}
      >
        {item.icon ? (
          <View style={styles.menuIcon}>
            {renderIcon(item.icon, { size: 16, color: muted })}
          </View>
        ) : null}
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-sm font-medium text-foreground"
          >
            {item.label}
          </Text>
          {item.description ? (
            <Text numberOfLines={2} className="text-xs leading-4 text-muted">
              {item.description}
            </Text>
          ) : null}
        </View>
        {item.selected ? <CheckGlyph size={16} color={foreground} /> : null}
      </Pressable>
    </Animated.View>
  );
}

/**
 * A panel that springs up out of the button that opened it, as wide as the
 * composer, for the model and action lists.
 */
function PromptMenu({
  open,
  composer,
  origin,
  label,
  items,
  reduce,
  onSelect,
  onClose,
}: {
  open: boolean;
  composer: Frame | null;
  origin: number;
  label: string;
  items: MenuItem[];
  reduce: boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const window = useWindowDimensions();
  const [present, setPresent] = useState(open);
  const progress = useSharedValue(0);
  if (open && !present) setPresent(true);

  const hide = useCallback(() => setPresent(false), []);

  useEffect(() => {
    if (!present) return;
    if (open) {
      progress.value = reduce
        ? withTiming(1, { duration: 120 })
        : withSpring(1, SPRING_PANEL);
    } else {
      progress.value = withTiming(
        0,
        reduce ? { duration: 120 } : MENU_EXIT,
        (done) => {
          if (done) scheduleOnRN(hide);
        },
      );
    }
  }, [hide, open, present, progress, reduce]);

  const panelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: Math.min(1, p * 1.6),
      transform: reduce
        ? []
        : [{ translateY: (1 - p) * 10 }, { scale: 0.86 + p * 0.14 }],
    };
  }, [reduce]);

  if (!present || !composer) return null;
  const width = Math.min(composer.width, 320);
  const left = Math.max(
    EDGE,
    Math.min(composer.x, window.width - width - EDGE),
  );
  // Grow out of the trigger's horizontal center, from the panel's bottom edge.
  const originX = Math.max(0, Math.min(width, origin - left));

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityLabel="Close menu"
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      />
      <Animated.View
        accessibilityRole="menu"
        accessibilityLabel={label}
        style={[
          styles.menu,
          {
            left,
            width,
            bottom: window.height - composer.y + MENU_GAP,
            transformOrigin: [originX, "100%", 0],
          },
          panelStyle,
        ]}
        className="rounded-2xl border border-border bg-background p-1.5"
      >
        {items.map((item, index) => (
          <MenuRow
            key={item.value}
            item={item}
            index={index}
            open={open}
            reduce={reduce}
            onSelect={onSelect}
          />
        ))}
      </Animated.View>
    </Modal>
  );
}

function SendIcon({
  stop,
  appear,
  exiting,
  reduce,
  color,
}: {
  stop: boolean;
  appear: boolean;
  exiting: boolean;
  reduce: boolean;
  color: string;
}) {
  // 0 below, 1 resting, 2 gone above.
  const progress = useSharedValue(appear ? 0 : 1);

  useEffect(() => {
    const target = exiting ? 2 : 1;
    progress.value = reduce ? target : withSpring(target, SPRING_SWAP);
  }, [exiting, progress, reduce]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const away = Math.abs(1 - p);
    return {
      opacity: Math.max(0, 1 - away),
      transform: reduce
        ? []
        : [{ translateY: (1 - p) * 3 }, { scale: 1 - away * 0.2 }],
    };
  }, [reduce]);

  return (
    <Animated.View style={[styles.sendIcon, style]}>
      {stop ? (
        <StopGlyph size={12} color={color} />
      ) : (
        <ArrowUpGlyph size={16} color={color} strokeWidth={2.25} />
      )}
    </Animated.View>
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
  onPress: () => void;
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
        if (!reduce) scale.value = withSpring(0.93, SPRING_PRESS);
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

export type PromptInputProps = Omit<
  TextInputProps,
  "value" | "defaultValue" | "onChangeText" | "onSubmitEditing" | "children"
> & {
  value?: string;
  /** Defaults to "". */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Models to choose from. The picker is hidden when empty. */
  models?: PromptModel[];
  model?: string;
  /** Defaults to the first model. */
  defaultModel?: string;
  onModelChange?: (model: string) => void;
  /** Things to add to the prompt, listed behind the + button. Hidden when empty. */
  actions?: PromptAction[];
  onAction?: (action: string) => void;
  /** Called with the trimmed prompt and the selected model. Clears the field when uncontrolled. */
  onSubmit?: (value: string, model?: string) => void | Promise<void>;
  /** While true, the send button becomes a stop button. */
  loading?: boolean;
  onStop?: () => void;
  /**
   * Puts the last prompt back in an empty field when you stop a reply, so you
   * can adjust it and send again. Defaults to true.
   */
  restoreOnStop?: boolean;
  /** Rows the field starts at. Defaults to 1. */
  minRows?: number;
  /** Rows the field grows to before scrolling. Defaults to 6. */
  maxRows?: number;
  /** Extra controls in the toolbar, after the + button. */
  leadingAction?: ReactNode;
  disabled?: boolean;
  /** Classes for the composer surface. */
  className?: string;
  /** Swaps icons and opens menus without motion, independently of the system preference. */
  disableAnimation?: boolean;
  ref?: Ref<TextInput>;
};

/**
 * A chat composer: a field that grows with its text, an action menu, a model
 * picker, and a send button that turns into stop while a reply streams.
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
  onSubmit,
  loading = false,
  onStop,
  restoreOnStop = true,
  minRows = 1,
  maxRows = 6,
  leadingAction,
  disabled = false,
  className = "",
  disableAnimation = false,
  placeholder = "Ask the agent to do something…",
  accessibilityLabel = "Prompt",
  onFocus,
  onBlur,
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
  const [focused, setFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [menu, setMenu] = useState<"actions" | "models" | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [origin, setOrigin] = useState(0);
  const surfaceRef = useRef<View>(null);
  const plusRef = useRef<View>(null);
  const modelRef = useRef<View>(null);
  const turn = useSharedValue(0);

  const { color: foreground } = useResolveClassNames("text-foreground");
  const { color: background } = useResolveClassNames("text-background");
  const { color: muted } = useResolveClassNames("text-muted");

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0 && !disabled && !loading;
  const minHeight = minRows * LINE_HEIGHT + FIELD_PADDING * 2;
  const maxHeight = maxRows * LINE_HEIGHT + FIELD_PADDING * 2;
  const height = Math.min(maxHeight, Math.max(minHeight, contentHeight));
  const selectedModel = models.find((entry) => entry.value === model);

  useEffect(() => {
    turn.value = reduce
      ? menu === "actions"
        ? 1
        : 0
      : withSpring(menu === "actions" ? 1 : 0, SPRING_SWAP);
  }, [menu, reduce, turn]);
  const plusStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 45}deg` }],
  }));

  const setValue = (next: string) => {
    if (controlledValue === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  const lastPrompt = useRef("");
  const stop = () => {
    onStop?.();
    if (restoreOnStop && value.trim() === "" && lastPrompt.current)
      setValue(lastPrompt.current);
  };

  const submit = () => {
    if (!canSubmit) return;
    lastPrompt.current = trimmed;
    void onSubmit?.(trimmed, model);
    if (controlledValue === undefined) setInternalValue("");
  };

  const openMenu = (which: "actions" | "models", trigger: View | null) => {
    surfaceRef.current?.measureInWindow((x, y, width, h) => {
      setFrame({ x, y, width, height: h });
      trigger?.measureInWindow((tx, _ty, tw) => {
        setOrigin(tx + tw / 2);
        setMenu(which);
      });
    });
  };

  const sendIcons = usePresence(loading ? "stop" : "send", loading, () => 260);
  const sendLabel = loading ? "Stop generating" : "Send prompt";

  const menuItems: MenuItem[] =
    menu === "models"
      ? models.map((entry) => ({ ...entry, selected: entry.value === model }))
      : actions;

  return (
    <View
      ref={surfaceRef}
      collapsable={false}
      className={`rounded-2xl border bg-background p-2 ${focused ? "border-border-strong" : "border-border"} ${disabled ? "opacity-60" : ""} ${className}`}
    >
      <TextInput
        ref={ref}
        multiline
        value={value}
        onChangeText={setValue}
        editable={!disabled}
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onContentSizeChange={({ nativeEvent }) =>
          setContentHeight(nativeEvent.contentSize.height)
        }
        scrollEnabled={contentHeight > maxHeight}
        placeholderTextColor={muted}
        cursorColor={foreground}
        selectionColor={foreground}
        className="px-2 text-sm text-foreground"
        style={[styles.field, { height }]}
        {...inputProps}
      />
      <View style={styles.toolbar}>
        {actions.length > 0 ? (
          <View ref={plusRef} collapsable={false}>
            <RoundButton
              label="Add to prompt"
              disabled={disabled}
              reduce={reduce}
              onPress={() => openMenu("actions", plusRef.current)}
              className={menu === "actions" ? "bg-surface" : ""}
            >
              <Animated.View style={plusStyle}>
                <PlusGlyph size={18} color={muted} />
              </Animated.View>
            </RoundButton>
          </View>
        ) : null}
        {leadingAction}
        {models.length > 0 ? (
          <Pressable
            ref={modelRef}
            collapsable={false}
            accessibilityRole="button"
            accessibilityLabel="Model"
            accessibilityValue={{
              text: selectedModel?.label ?? "Choose model",
            }}
            accessibilityState={{ expanded: menu === "models", disabled }}
            disabled={disabled}
            onPress={() => openMenu("models", modelRef.current)}
            className="h-8 max-w-[60%] flex-row items-center gap-1.5 rounded-xl px-2.5 active:bg-surface"
          >
            {selectedModel?.icon
              ? renderIcon(selectedModel.icon, { size: 14, color: muted })
              : null}
            <Text
              numberOfLines={1}
              className="shrink text-xs font-medium text-muted"
            >
              {selectedModel?.label ?? "Choose model"}
            </Text>
            <ChevronDownGlyph size={12} color={muted} />
          </Pressable>
        ) : null}
        <View style={styles.send}>
          <RoundButton
            label={sendLabel}
            disabled={loading ? !onStop : !canSubmit}
            reduce={reduce}
            onPress={loading ? stop : submit}
            className={
              loading || canSubmit ? "bg-foreground" : "bg-foreground/15"
            }
          >
            {sendIcons.map((item) => (
              <SendIcon
                key={item.key}
                stop={item.value}
                appear={item.appear}
                exiting={item.exiting}
                reduce={reduce}
                color={String(loading || canSubmit ? background : muted)}
              />
            ))}
          </RoundButton>
        </View>
      </View>
      <PromptMenu
        open={menu !== null}
        composer={frame}
        origin={origin}
        label={menu === "models" ? "Models" : "Add to prompt"}
        items={menuItems}
        reduce={reduce}
        onClose={() => setMenu(null)}
        onSelect={(selected) => {
          if (menu === "models") {
            if (controlledModel === undefined) setInternalModel(selected);
            onModelChange?.(selected);
          } else {
            onAction?.(selected);
          }
          setMenu(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    lineHeight: LINE_HEIGHT,
    paddingTop: FIELD_PADDING,
    paddingBottom: FIELD_PADDING,
    textAlignVertical: "top",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    minHeight: 32,
  },
  send: { marginLeft: "auto" },
  round: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: { position: "absolute" },
  menu: {
    position: "absolute",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  menuIcon: { width: 20, alignItems: "center" },
});
