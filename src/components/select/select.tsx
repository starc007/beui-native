import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewProps,
} from "react-native";
import Animated, {
  cancelAnimation,
  interpolate,
  ReduceMotion,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { DrawnPath, type PathSegment } from "../../primitives/drawn-path";
import { EASE_OUT } from "../../styles/motion";

// One progress value drives the surface, gap, corners and chevron, as on the
// web: a short, barely bouncy spring in, and a quicker ease back out.
const UNFOLD = {
  duration: 300,
  dampingRatio: 0.88,
  reduceMotion: ReduceMotion.System,
};
const FOLD = { duration: 200, easing: EASE_OUT };
const FADE = { duration: 120 };
const ITEMS_IN = { duration: 120, easing: EASE_OUT };
const RADIUS = 12;
// How far the open panel sits from the trigger once it has pulled away.
const GAP = 8;
// The panel starts as a thin lip flush against the trigger's edge.
const LIP = 8;
// Space to keep between the panel and the window edge when choosing a side.
const EDGE = 16;
const MAX_HEIGHT = 320;
const CHEVRON: PathSegment[] = [
  [6, 9, 12, 15],
  [12, 15, 18, 9],
];
const CHECK: PathSegment[] = [
  [5, 13, 9, 17],
  [9, 17, 19, 7],
];

type Placement = "bottom" | "top";
type Anchor = { x: number; y: number; width: number; height: number };

type SelectContextValue = {
  value: string | undefined;
  open: boolean;
  setOpen: (open: boolean) => void;
  select: (value: string) => void;
  labels: Map<string, string>;
  register: (value: string, label: string) => void;
  progress: SharedValue<number>;
  reduce: boolean;
  disabled: boolean;
  triggerRef: RefObject<View | null>;
  anchor: Anchor | null;
  placement: Placement;
  setPlacement: (placement: Placement) => void;
};

const SelectContext = createContext<SelectContextValue | null>(null);
// Items render twice: once hidden, only to register their labels for
// SelectValue, and once in the open panel.
const RegistrationContext = createContext(false);

function useSelect(component: string) {
  const context = useContext(SelectContext);
  if (!context) throw new Error(`${component} must be used within Select.`);
  return context;
}

export type SelectProps = {
  /** Controlled value. Omit it and use `defaultValue` for uncontrolled use. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Controlled open state. Omit it and use `defaultOpen` for uncontrolled use. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** Opens and closes without unfolding, independently of the system preference. */
  disableAnimation?: boolean;
  children: ReactNode;
};

export function Select({
  value: valueProp,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  disableAnimation = false,
  children,
}: SelectProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const value = valueProp ?? uncontrolledValue;
  const open = openProp ?? uncontrolledOpen;
  const [labels, setLabels] = useState<Map<string, string>>(new Map());
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [placement, setPlacement] = useState<Placement>("bottom");
  const triggerRef = useRef<View>(null);
  const progress = useSharedValue(0);

  const setOpen = useCallback(
    (next: boolean) => {
      if (next && disabled) return;
      if (next) {
        // Find the trigger on screen before the panel appears beside it.
        triggerRef.current?.measureInWindow((x, y, width, height) => {
          setAnchor({ x, y, width, height });
          if (openProp === undefined) setUncontrolledOpen(true);
          onOpenChange?.(true);
        });
        return;
      }
      if (openProp === undefined) setUncontrolledOpen(false);
      onOpenChange?.(false);
    },
    [disabled, onOpenChange, openProp],
  );

  // A controlled open without a measured trigger still needs its anchor.
  useEffect(() => {
    if (!open || anchor) return;
    triggerRef.current?.measureInWindow((x, y, width, height) =>
      setAnchor({ x, y, width, height }),
    );
  }, [anchor, open]);

  const select = useCallback(
    (next: string) => {
      if (valueProp === undefined) setUncontrolledValue(next);
      onValueChange?.(next);
      setOpen(false);
    },
    [onValueChange, setOpen, valueProp],
  );

  const register = useCallback((item: string, label: string) => {
    setLabels((current) =>
      current.get(item) === label ? current : new Map(current).set(item, label),
    );
  }, []);

  const context = useMemo<SelectContextValue>(
    () => ({
      value,
      open,
      setOpen,
      select,
      labels,
      register,
      progress,
      reduce,
      disabled,
      triggerRef,
      anchor,
      placement,
      setPlacement,
    }),
    [
      anchor,
      disabled,
      labels,
      open,
      placement,
      progress,
      reduce,
      register,
      select,
      setOpen,
      value,
    ],
  );

  return (
    <SelectContext.Provider value={context}>{children}</SelectContext.Provider>
  );
}

export type SelectTriggerProps = Omit<ViewProps, "children"> & {
  children: ReactNode;
  className?: string;
};

export function SelectTrigger({
  children,
  className = "",
  accessibilityLabel,
  accessibilityHint,
  ...props
}: SelectTriggerProps) {
  const context = useSelect("SelectTrigger");
  const { progress, reduce, placement, open, disabled } = context;
  const { color: muted } = useResolveClassNames("text-muted");
  const drawn = useSharedValue(1);
  const label = context.labels.get(context.value ?? "");

  // The edge facing the panel flattens while the panel is attached to it and
  // rounds back as the panel pulls away, on the panel's own curve.
  const shapeStyle = useAnimatedStyle(() => {
    const near = reduce
      ? RADIUS
      : interpolate(
          progress.value,
          [0, 0.2, 0.4, 1],
          [RADIUS, 0, 0, RADIUS],
          "clamp",
        );
    return placement === "top"
      ? {
          borderTopLeftRadius: near,
          borderTopRightRadius: near,
          borderBottomLeftRadius: RADIUS,
          borderBottomRightRadius: RADIUS,
        }
      : {
          borderTopLeftRadius: RADIUS,
          borderTopRightRadius: RADIUS,
          borderBottomLeftRadius: near,
          borderBottomRightRadius: near,
        };
  }, [placement, reduce]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${Math.min(1, Math.max(0, progress.value)) * 180}deg`,
      },
    ],
  }));

  return (
    <Animated.View
      {...props}
      ref={context.triggerRef}
      collapsable={false}
      className={`border border-border bg-background ${disabled ? "opacity-50" : ""} ${className}`}
      style={[styles.trigger, shapeStyle, props.style]}
    >
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ expanded: open, disabled }}
        accessibilityValue={label ? { text: label } : undefined}
        disabled={disabled}
        onPress={() => context.setOpen(!open)}
        className="min-h-11 flex-row items-center justify-between gap-2 px-3 py-2"
      >
        <View className="flex-1">{children}</View>
        <Animated.View style={[styles.chevron, chevronStyle]}>
          <DrawnPath
            segments={CHEVRON}
            size={16}
            strokeWidth={2}
            color={muted}
            progress={drawn}
          />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export type SelectValueProps = {
  placeholder?: string;
  className?: string;
};

export function SelectValue({
  placeholder = "Select",
  className = "",
}: SelectValueProps) {
  const context = useSelect("SelectValue");
  const label =
    context.value === undefined ? undefined : context.labels.get(context.value);
  return (
    <Text
      numberOfLines={1}
      className={`text-sm ${label ? "text-foreground" : "text-muted"} ${className}`}
    >
      {label ?? placeholder}
    </Text>
  );
}

export type SelectContentProps = {
  children: ReactNode;
  className?: string;
};

export function SelectContent({
  children,
  className = "",
}: SelectContentProps) {
  const context = useSelect("SelectContent");
  const { open, progress, reduce, anchor, placement, setPlacement } = context;
  const window = useWindowDimensions();
  const [height, setHeight] = useState(0);
  // The modal stays up while the panel folds away.
  const [present, setPresent] = useState(open);
  const itemsIn = useSharedValue(open ? 1 : 0);

  if (open && !present) setPresent(true);

  const hide = useCallback(() => setPresent(false), []);

  useEffect(() => {
    if (!present) return;
    cancelAnimation(progress);
    if (open) {
      progress.value = reduce ? withTiming(1, FADE) : withSpring(1, UNFOLD);
      itemsIn.value = reduce ? 1 : withTiming(1, ITEMS_IN);
    } else {
      itemsIn.value = withTiming(0, { duration: 80 });
      progress.value = withTiming(0, reduce ? FADE : FOLD, (done) => {
        if (done) scheduleOnRN(hide);
      });
    }
  }, [hide, itemsIn, open, present, progress, reduce]);

  // Choose a side once the panel's height is known: below unless it doesn't
  // fit there and there is more room above.
  useLayoutEffect(() => {
    if (!open || !anchor || height === 0) return;
    const below = window.height - (anchor.y + anchor.height);
    const above = anchor.y;
    setPlacement(
      below < height + GAP + EDGE && above > below ? "top" : "bottom",
    );
  }, [anchor, height, open, setPlacement, window.height]);

  const panelHeight = Math.min(height, MAX_HEIGHT);
  const isTop = placement === "top";
  const ready = panelHeight > 0 && !reduce;

  const panelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const reveal = Math.min(1, Math.max(0, p));
    const detach = interpolate(p, [0.4, 1], [0, 1], "clamp");
    const near = ready ? RADIUS * detach : RADIUS;
    // Reveal a full-size panel from its near edge without scaling its rows.
    const visible = ready ? LIP + (panelHeight - LIP) * reveal : panelHeight;
    return {
      height: visible,
      opacity: interpolate(p, reduce ? [0, 1] : [0, 0.12], [0, 1], "clamp"),
      transform: [
        { translateY: ready ? (isTop ? GAP : -GAP) * (1 - detach) : 0 },
      ],
      borderTopLeftRadius: isTop ? RADIUS : near,
      borderTopRightRadius: isTop ? RADIUS : near,
      borderBottomLeftRadius: isTop ? near : RADIUS,
      borderBottomRightRadius: isTop ? near : RADIUS,
    };
  }, [isTop, panelHeight, ready, reduce]);

  const itemsStyle = useAnimatedStyle(
    () => ({
      opacity: itemsIn.value,
      transform: [{ translateY: reduce ? 0 : -4 * (1 - itemsIn.value) }],
    }),
    [reduce],
  );

  const position =
    anchor === null
      ? null
      : isTop
        ? {
            left: anchor.x,
            width: anchor.width,
            bottom: window.height - anchor.y + GAP,
          }
        : {
            left: anchor.x,
            width: anchor.width,
            top: anchor.y + anchor.height + GAP,
          };

  return (
    <>
      {/* Hidden copy so SelectValue knows every label before the first open. */}
      <View style={styles.registry} accessibilityElementsHidden>
        <RegistrationContext.Provider value={true}>
          {children}
        </RegistrationContext.Provider>
      </View>

      <Modal
        transparent
        visible={present}
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => context.setOpen(false)}
      >
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          style={StyleSheet.absoluteFill}
          onPress={() => context.setOpen(false)}
        />
        {position ? (
          <Animated.View
            accessibilityViewIsModal
            className={`overflow-hidden border border-border bg-background ${className}`}
            style={[styles.panel, position, panelStyle]}
          >
            {/* Pinned to the near edge, so the reveal uncovers it from there. */}
            <View
              style={[
                styles.content,
                isTop ? styles.pinBottom : styles.pinTop,
                height > MAX_HEIGHT && { height: MAX_HEIGHT },
              ]}
            >
              <ScrollView
                scrollEnabled={height > MAX_HEIGHT}
                bounces={false}
                onContentSizeChange={(_, contentHeight) => {
                  // Content plus the panel's 1-point borders.
                  setHeight(contentHeight + 2);
                }}
              >
                <Animated.View style={[styles.items, itemsStyle]}>
                  {children}
                </Animated.View>
              </ScrollView>
            </View>
          </Animated.View>
        ) : null}
      </Modal>
    </>
  );
}

export type SelectItemProps = {
  value: string;
  /** Text for SelectValue and screen readers when children aren't a string. */
  label?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export function SelectItem({
  value,
  label: labelProp,
  disabled = false,
  className = "",
  children,
}: SelectItemProps) {
  const context = useSelect("SelectItem");
  const registering = useContext(RegistrationContext);
  const { color: foreground } = useResolveClassNames("text-foreground");
  const drawn = useSharedValue(1);
  const selected = context.value === value;
  const label = labelProp ?? (typeof children === "string" ? children : value);
  const { register } = context;

  useLayoutEffect(() => {
    if (registering) register(value, label);
  }, [label, register, registering, value]);

  if (registering) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => context.select(value)}
    >
      {({ pressed }) => (
        <View
          className={`min-h-10 flex-row items-center justify-between gap-2 rounded-lg px-2.5 py-2 ${selected || pressed ? "bg-surface" : ""} ${disabled ? "opacity-50" : ""} ${className}`}
        >
          {typeof children === "string" ? (
            <Text
              className={`flex-1 text-sm ${selected ? "text-foreground" : "text-muted"}`}
            >
              {children}
            </Text>
          ) : (
            <View className="flex-1">{children}</View>
          )}
          {selected ? (
            <DrawnPath
              segments={CHECK}
              size={14}
              strokeWidth={2.5}
              color={foreground}
              progress={drawn}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: { alignSelf: "stretch" },
  chevron: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    position: "absolute",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  },
  content: { position: "absolute", left: 0, right: 0 },
  pinTop: { top: 0 },
  pinBottom: { bottom: 0 },
  items: { padding: 4 },
  registry: { display: "none" },
});
