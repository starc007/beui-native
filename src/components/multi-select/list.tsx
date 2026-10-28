import {
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useResolveClassNames } from "uniwind";
import { DrawnPath, type PathSegment } from "../../primitives/drawn-path";
import { Overlay } from "../../primitives/overlay";
import { EASE_OUT } from "../../styles/motion";
import {
  MultiSelectGroupContext,
  RegistryContext,
  useMultiSelectContext,
} from "./context";

// The web version's morph: the panel grows out of the field and pulls away
// from it on a spring with a light bounce, then folds back quickly.
const MORPH = {
  duration: 500,
  dampingRatio: 0.78,
  reduceMotion: ReduceMotion.System,
};
const FOLD = { duration: 200, easing: EASE_OUT };
const FADE = { duration: 150 };
const CHECK_FADE = { duration: 140, easing: EASE_OUT };
// How far the open panel sits from the field.
const GAP = 6;
// Space kept from the window's bottom edge, or the keyboard, and from its top.
const EDGE = 16;
const TOP_EDGE = 56;
// With less room than this below the field, the panel opens above it if
// there's more room there.
const MIN_BELOW = 220;
const MAX_LIST = 256;
const CHECK: PathSegment[] = [
  [20, 6, 9, 17],
  [9, 17, 4, 12],
];

/** The on-screen keyboard's height while `active`, or 0. */
function useKeyboardHeight(active: boolean) {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!active) return;
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(
      ios ? "keyboardWillShow" : "keyboardDidShow",
      (event) => setHeight(event.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      ios ? "keyboardWillHide" : "keyboardDidHide",
      () => setHeight(0),
    );
    // React Native Web has no keyboard metrics; it reports no keyboard.
    if (typeof Keyboard.metrics === "function") {
      setHeight(Keyboard.metrics()?.height ?? 0);
    }
    return () => {
      show.remove();
      hide.remove();
    };
  }, [active]);
  return height;
}

export type MultiSelectContentProps = {
  children: ReactNode;
  className?: string;
};

/**
 * The panel. It floats over the page beside the field: below it, unless the
 * room there, keyboard included, is tight and there's more above. A tap
 * outside, or Android's back button, closes it.
 */
export function MultiSelectContent({
  children,
  className = "",
}: MultiSelectContentProps) {
  const context = useMultiSelectContext("MultiSelectContent");
  const { open, anchor, reduce } = context;
  const window = useWindowDimensions();
  const keyboard = useKeyboardHeight(open);
  // The modal stays up while the panel folds away.
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);
  const [height, setHeight] = useState(0);
  const progress = useSharedValue(0);

  const hide = useCallback(() => setPresent(false), []);

  useEffect(() => {
    if (!present) return;
    cancelAnimation(progress);
    if (open) {
      progress.value = reduce ? withTiming(1, FADE) : withSpring(1, MORPH);
    } else {
      progress.value = withTiming(0, reduce ? FADE : FOLD, (done) => {
        if (done) scheduleOnRN(hide);
      });
    }
  }, [hide, open, present, progress, reduce]);

  const below = anchor
    ? window.height - keyboard - (anchor.y + anchor.height) - GAP - EDGE
    : 0;
  const above = anchor ? anchor.y - GAP - TOP_EDGE : 0;
  const isTop = below < MIN_BELOW && above > below;
  const room = Math.max(120, isTop ? above : below);

  const panelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      // A spring past 1 grows the panel a little past its size: the bounce.
      height: reduce ? height : height * Math.max(0, p),
      opacity: Math.min(1, Math.max(0, p * 3)),
      transform: [
        { translateY: (isTop ? -GAP : GAP) * Math.min(1, Math.max(0, p)) },
      ],
    };
  }, [height, isTop, reduce]);

  const position =
    anchor === null
      ? null
      : isTop
        ? {
            left: anchor.x,
            width: anchor.width,
            bottom: window.height - anchor.y,
          }
        : {
            left: anchor.x,
            width: anchor.width,
            top: anchor.y + anchor.height,
          };

  return (
    <>
      {/* A hidden copy, so chips know every label before the first open. */}
      <View style={styles.registry} accessibilityElementsHidden>
        <RegistryContext.Provider value={true}>
          {children}
        </RegistryContext.Provider>
      </View>

      <Overlay visible={present} onRequestClose={() => context.setOpen(false)}>
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          style={StyleSheet.absoluteFill}
          onPress={() => context.setOpen(false)}
        />
        {position ? (
          <Animated.View
            accessibilityViewIsModal
            className={`overflow-hidden rounded-xl border border-border bg-background ${className}`}
            style={[styles.panel, position, panelStyle]}
          >
            {/* Pinned to the edge nearest the field and measured at its own
                height, so the panel uncovers it from there. */}
            <View
              style={[
                styles.content,
                isTop ? styles.pinBottom : styles.pinTop,
                { maxHeight: room - 2 },
              ]}
              onLayout={({ nativeEvent }) =>
                // The panel's 1-point border on each side.
                setHeight(nativeEvent.layout.height + 2)
              }
            >
              {children}
            </View>
          </Animated.View>
        ) : null}
      </Overlay>
    </>
  );
}

export type MultiSelectListProps = {
  children: ReactNode;
  accessibilityLabel?: string;
  className?: string;
};

/** Scrolls past 256 points, or sooner when the room beside the field is tight. */
export function MultiSelectList({
  children,
  accessibilityLabel = "Options",
  className = "",
}: MultiSelectListProps) {
  const registering = useContext(RegistryContext);
  if (registering) return <>{children}</>;
  return (
    <ScrollView
      accessibilityLabel={accessibilityLabel}
      keyboardShouldPersistTaps="handled"
      style={styles.list}
      contentContainerClassName={`p-1.5 ${className}`}
    >
      {children}
    </ScrollView>
  );
}

export type MultiSelectGroupProps = {
  children: ReactNode;
  className?: string;
};

/** Hides itself while a query leaves none of its options. */
export function MultiSelectGroup({
  children,
  className = "",
}: MultiSelectGroupProps) {
  const registering = useContext(RegistryContext);
  const [shown, setShown] = useState<Map<string, boolean>>(new Map());
  const report = useCallback((value: string, visible: boolean) => {
    setShown((current) => {
      if (current.get(value) === visible) return current;
      const next = new Map(current);
      next.set(value, visible);
      return next;
    });
  }, []);
  const empty = useMemo(
    () => shown.size > 0 && ![...shown.values()].some(Boolean),
    [shown],
  );

  if (registering) return <>{children}</>;

  return (
    <MultiSelectGroupContext.Provider value={report}>
      <View
        style={empty ? styles.hidden : null}
        className={`py-0.5 ${className}`}
      >
        {children}
      </View>
    </MultiSelectGroupContext.Provider>
  );
}

export function MultiSelectLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const registering = useContext(RegistryContext);
  if (registering) return null;
  return (
    <Text
      accessibilityRole="header"
      className={`px-2 py-1.5 text-[11px] font-medium uppercase tracking-widest text-muted ${className}`}
    >
      {children}
    </Text>
  );
}

export type MultiSelectItemProps = {
  value: string;
  children: ReactNode;
  /** The label for chips, search and screen readers when children aren't a string. */
  textValue?: string;
  /** Extra words a query can match. */
  keywords?: string[];
  disabled?: boolean;
  onSelect?: (value: string) => void;
  className?: string;
};

export function MultiSelectItem(props: MultiSelectItemProps) {
  const registering = useContext(RegistryContext);
  return registering ? <RegisteredItem {...props} /> : <ItemRow {...props} />;
}

/** The hidden copy's half: tells the root about the option. */
function RegisteredItem({
  value,
  children,
  textValue,
  keywords = [],
  disabled = false,
}: MultiSelectItemProps) {
  const { register, unregister } = useMultiSelectContext("MultiSelectItem");
  const label = textValue ?? (typeof children === "string" ? children : value);
  const keywordKey = keywords.join("\u0000");
  const words = useMemo(
    () => (keywordKey ? keywordKey.split("\u0000") : []),
    [keywordKey],
  );
  useEffect(() => {
    register({ value, label, keywords: words, disabled });
  }, [disabled, label, register, value, words]);
  useEffect(() => () => unregister(value), [unregister, value]);
  return null;
}

/** The panel's half: a checkbox row. */
function ItemRow({
  value,
  children,
  textValue,
  disabled = false,
  onSelect,
  className = "",
}: MultiSelectItemProps) {
  const context = useMultiSelectContext("MultiSelectItem");
  const report = useContext(MultiSelectGroupContext);
  const { color: foreground } = useResolveClassNames("text-foreground");
  const label = textValue ?? (typeof children === "string" ? children : value);
  const selected = context.values.includes(value);
  const visible = context.isVisible(value);

  useEffect(() => {
    report?.(value, visible);
  }, [report, value, visible]);

  const mark = useSharedValue(selected ? 1 : 0);
  const drawn = useSharedValue(1);
  useEffect(() => {
    const target = selected ? 1 : 0;
    mark.value = context.reduce ? target : withTiming(target, CHECK_FADE);
  }, [context.reduce, mark, selected]);
  const markStyle = useAnimatedStyle(() => ({
    opacity: mark.value,
    transform: [{ scale: 0.82 + 0.18 * mark.value }],
  }));

  if (!visible) return null;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      // The aria props reach every platform, including React Native Web,
      // which ignores accessibilityState.checked.
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={() => {
        onSelect?.(value);
        context.toggle(value);
      }}
      className={`min-h-11 flex-row items-center gap-2 rounded-lg px-2 py-2 active:bg-surface ${disabled ? "opacity-45" : ""} ${className}`}
    >
      <View className="min-w-0 flex-1">
        {typeof children === "string" ? (
          <Text
            className={`text-sm ${selected ? "text-foreground" : "text-muted"}`}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
      <Animated.View style={[styles.check, markStyle]}>
        <DrawnPath
          segments={CHECK}
          size={16}
          strokeWidth={2.2}
          color={foreground}
          progress={drawn}
        />
      </Animated.View>
    </Pressable>
  );
}

export function MultiSelectEmpty({
  children = "No options found.",
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  const registering = useContext(RegistryContext);
  const context = useMultiSelectContext("MultiSelectEmpty");
  if (registering || context.visibleCount > 0) return null;
  return (
    <Text
      accessibilityLiveRegion="polite"
      className={`px-3 py-8 text-center text-sm text-muted ${className}`}
    >
      {children}
    </Text>
  );
}

export function MultiSelectSeparator({
  className = "",
}: {
  className?: string;
}) {
  const registering = useContext(RegistryContext);
  if (registering) return null;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      className={`-mx-1 my-1 h-px bg-border ${className}`}
    />
  );
}

const styles = StyleSheet.create({
  registry: { display: "none" },
  // Lifts the floating panel off the page it covers.
  panel: {
    position: "absolute",
    boxShadow: "0 10px 30px -8px rgba(0, 0, 0, 0.18)",
  },
  content: { position: "absolute", left: 0, right: 0 },
  pinTop: { top: 0 },
  pinBottom: { bottom: 0 },
  list: { flexGrow: 0, flexShrink: 1, maxHeight: MAX_LIST },
  hidden: { display: "none" },
  check: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
