import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { FullWindowOverlay } from "react-native-screens";
import { scheduleOnRN } from "react-native-worklets";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import {
  CheckGlyph,
  ExclaimGlyph,
  InfoGlyph,
} from "../../primitives/agent-icons";
import { RollText } from "../../primitives/roll-text";
import { SpinGlyph } from "../../primitives/spin-glyph";
import { EASE_OUT } from "../../styles/motion";
import {
  type ToastItem,
  type ToastStatus,
  toast,
  toastStore,
} from "./toast-store";

// Arriving runs linearly; each phase eases on its own slice of it, so
// later phases are not crushed into the first frames of one ease-out.
const ENTER = { duration: 560, easing: Easing.linear } as const;
const EXIT = { duration: 420, easing: Easing.linear } as const;

/** Ease-out over one phase's slice of a linear progress, clamped to 0..1. */
function phase(progress: number, from: number, to: number) {
  "worklet";
  const t = Math.max(0, Math.min(1, (progress - from) / (to - from)));
  return 1 - (1 - t) ** 3;
}
/** The smallest the shell starts from: a circle around the status. */
const MORPH_START = 44;
/** The pill's corner radius, and the width of each rounded cap. */
const CAP = 22;
/** A soft lift with the border, so the pill reads on any screen. */
const SHADOW = "0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)";
/** The drop covers the first half, from this far past the edge. */
const DROP_FROM = 24;
const REFLOW = { duration: 220, easing: EASE_OUT } as const;
const FADE = { duration: 160 } as const;
/** How far each toast behind the front one peeks out, and how much smaller it is. */
const PEEK = 8;
const SHRINK = 0.06;
const GAP = 8;
const EDGE = 16;
const FLING_X = 90;
const FLING_Y = 28;

type Position = "top" | "bottom";
type Target = { y: number; scale: number; opacity: number };
type Size = { width: number; height: number };

export type ToasterProps = {
  /** Where toasts come from. Defaults to "top". */
  position?: Position;
  /** Space above, such as the top safe-area inset. Defaults to 0. */
  topInset?: number;
  /** Space below, such as the bottom safe-area inset. Defaults to 0. */
  bottomInset?: number;
  /** How many toasts show at once. Defaults to 3. */
  visibleToasts?: number;
  /** Called when a toast appears or changes status, such as for haptics. */
  onShow?: (toast: ToastItem) => void;
  /** Moves without motion, independently of the system preference. */
  disableAnimation?: boolean;
};

/**
 * Shows the toasts from `toast()`. Mount it once, after your navigator, so it
 * sits above your screens. Toasts stack like notifications: tap the stack to
 * spread it out, swipe one away to dismiss it.
 */
export function Toaster({
  position = "top",
  topInset = 0,
  bottomInset = 0,
  visibleToasts = 3,
  onShow,
  disableAnimation = false,
}: ToasterProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const items = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
  );
  const [sizes, setSizes] = useState<Record<string, Size>>({});
  const [expanded, setExpanded] = useState(false);
  const [overlayReady, setOverlayReady] = useState(false);
  if (!overlayReady && items.length > 0) setOverlayReady(true);
  // Timers hold while the stack is open or a finger is down. Both live in
  // refs, so a gesture ending and a toggle land in either order.
  const touching = useRef(false);
  const open = useRef(false);
  const syncTimers = useCallback(() => {
    if (touching.current || open.current) toastStore.pause();
    else toastStore.resume();
  }, []);

  // Newest first, and only the ones not leaving.
  const live = items.filter((item) => !item.dismissed).reverse();
  if (expanded && live.length <= 1) setExpanded(false);

  useEffect(() => {
    open.current = expanded;
    syncTimers();
  }, [expanded, syncTimers]);
  const onTouch = useCallback(
    (down: boolean) => {
      touching.current = down;
      syncTimers();
    },
    [syncTimers],
  );

  // Haptics and screen readers hear about new toasts and status changes.
  const seen = useRef(new Map<string, ToastStatus>());
  const onShowRef = useRef(onShow);
  onShowRef.current = onShow;
  useEffect(() => {
    for (const item of items) {
      if (item.dismissed || seen.current.get(item.id) === item.status) continue;
      seen.current.set(item.id, item.status);
      onShowRef.current?.(item);
      if (Platform.OS === "ios")
        AccessibilityInfo.announceForAccessibility(
          item.description ? `${item.title}. ${item.description}` : item.title,
        );
    }
    for (const id of seen.current.keys())
      if (!items.some((item) => item.id === id)) seen.current.delete(id);
  }, [items]);

  const onMeasure = useCallback((id: string, size: Size) => {
    setSizes((previous) => {
      const old = previous[id];
      return old && old.width === size.width && old.height === size.height
        ? previous
        : { ...previous, [id]: size };
    });
  }, []);
  const onDismiss = useCallback((id: string) => toast.dismiss(id), []);
  const onRemove = useCallback((id: string) => {
    toastStore.remove(id);
    setSizes(({ [id]: _, ...rest }) => rest);
  }, []);
  const onToggle = useCallback(() => {
    if (live.length <= 1) return;
    open.current = !open.current;
    syncTimers();
    setExpanded(open.current);
  }, [live.length, syncTimers]);

  const sign = position === "top" ? 1 : -1;
  const front = sizes[live[0]?.id ?? ""] ?? { width: 0, height: 44 };
  const targets = new Map<string, Target & { depth: number }>();
  let offset = 0;
  live.forEach((item, depth) => {
    const height = sizes[item.id]?.height ?? 44;
    const hidden = depth >= visibleToasts;
    if (expanded) {
      targets.set(item.id, {
        depth,
        y: sign * offset,
        scale: 1,
        opacity: hidden ? 0 : 1,
      });
      offset += height + GAP;
    } else {
      // Toasts differ in size, so collapsed ones wait unseen behind the
      // front one, and solid peeks of the front's shape stand in for them.
      targets.set(item.id, {
        depth,
        y: 0,
        scale: 1 - depth * SHRINK,
        opacity: depth === 0 ? 1 : 0,
      });
    }
  });
  const peeks = Math.min(live.length, visibleToasts) - 1;

  const layer = (
    <View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFill,
        styles.layer,
        position === "top"
          ? { paddingTop: topInset + 8 }
          : { paddingBottom: bottomInset + 8 },
      ]}
    >
      <View
        pointerEvents="box-none"
        style={position === "top" ? styles.anchorTop : styles.anchorBottom}
      >
        {Array.from({ length: Math.max(0, visibleToasts - 1) }, (_, i) => (
          <Peek
            key={`peek-${i + 1}`}
            depth={i + 1}
            size={front}
            shown={!expanded && i < peeks}
            position={position}
            reduce={reduce}
          />
        ))}
        {items.map((item) => {
          const target = targets.get(item.id);
          return (
            <ToastView
              key={item.id}
              item={item}
              target={target}
              zIndex={target ? 100 - target.depth : 0}
              // Collapsed toasts wait unseen behind the front one, so only
              // the front one takes touches until the stack spreads out.
              interactive={!!target && (expanded || target.depth === 0)}
              position={position}
              reduce={reduce}
              onMeasure={onMeasure}
              onDismiss={onDismiss}
              onRemove={onRemove}
              onToggle={onToggle}
              onTouch={onTouch}
            />
          );
        })}
      </View>
    </View>
  );

  // On iOS native tabs and modals draw above React Native views, so toasts
  // get their own layer on the window. Touches outside a toast pass through.
  // It mounts with the first toast, once the app's window is up, and then
  // stays: a remounted overlay stops showing its content.
  if (Platform.OS === "ios") {
    if (!overlayReady) return null;
    return (
      <FullWindowOverlay>
        <GestureHandlerRootView
          pointerEvents="box-none"
          style={StyleSheet.absoluteFill}
        >
          {layer}
        </GestureHandlerRootView>
      </FullWindowOverlay>
    );
  }
  return layer;
}

function ToastView({
  item,
  target,
  zIndex,
  interactive,
  position,
  reduce,
  onMeasure,
  onDismiss,
  onRemove,
  onToggle,
  onTouch,
}: {
  item: ToastItem;
  target?: Target;
  zIndex: number;
  interactive: boolean;
  position: Position;
  reduce: boolean;
  onMeasure: (id: string, size: Size) => void;
  onDismiss: (id: string) => void;
  onRemove: (id: string) => void;
  onToggle: () => void;
  onTouch: (down: boolean) => void;
}) {
  const window = useWindowDimensions();
  const sign = position === "top" ? 1 : -1;
  const enter = useSharedValue(0);
  const y = useSharedValue(target?.y ?? 0);
  const scale = useSharedValue(target?.scale ?? 1);
  const opacity = useSharedValue(target?.opacity ?? 1);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const height = useSharedValue(44);
  const flung = useSharedValue(0);
  // The laid-out width, and the width the pill shows at rest, which glides
  // to a new layout when the status or title changes.
  const layoutWidth = useSharedValue(0);
  const restWidth = useSharedValue(0);
  const measured = useRef(false);

  useEffect(() => {
    if (!target) return;
    const config = reduce ? { duration: 0 } : REFLOW;
    y.value = withTiming(target.y, config);
    scale.value = withTiming(target.scale, config);
    opacity.value = withTiming(target.opacity, reduce ? FADE : REFLOW);
  }, [opacity, reduce, scale, target, y]);

  // Leaving mirrors arriving. A swipe already carried it away.
  useEffect(() => {
    if (!item.dismissed || flung.value) return;
    const id = item.id;
    enter.value = withTiming(0, reduce ? FADE : EXIT, (done) => {
      if (done) scheduleOnRN(onRemove, id);
    });
  }, [enter, flung, item.dismissed, item.id, onRemove, reduce]);

  // Gesture callbacks run as worklets, so they hand the id to plain functions
  // from the Toaster; capturing the `toast` object itself crashes worklets.
  const id = item.id;

  const pan = Gesture.Pan()
    .enabled(item.dismissible && !item.dismissed)
    .activeOffsetX([-12, 12])
    .activeOffsetY([-10, 10])
    .onBegin(() => {
      scheduleOnRN(onTouch, true);
    })
    .onUpdate((event) => {
      dragX.value = event.translationX;
      // Away from the edge resists; toward it follows the finger.
      const out = event.translationY * sign < 0;
      dragY.value = out ? event.translationY : event.translationY * 0.15;
    })
    .onEnd((event) => {
      const sideways =
        Math.abs(event.translationX) > FLING_X ||
        Math.abs(event.velocityX) > 800;
      const outward =
        event.translationY * sign < -FLING_Y || event.velocityY * sign < -500;
      if (!sideways && !outward) {
        dragX.value = withTiming(0, REFLOW);
        dragY.value = withTiming(0, REFLOW);
        return;
      }
      flung.value = 1;
      scheduleOnRN(onDismiss, id);
      const done = (finished?: boolean) => {
        "worklet";
        if (finished) scheduleOnRN(onRemove, id);
      };
      if (sideways) {
        const direction = Math.sign(event.translationX || event.velocityX);
        dragX.value = withTiming(direction * window.width, EXIT, done);
      } else {
        dragY.value = withTiming(-sign * (height.value + 80), EXIT, done);
      }
    })
    .onFinalize(() => {
      scheduleOnRN(onTouch, false);
    });

  // The stack's position and depth, plus a quick fade so the morph starts
  // from the edge. It drops in as a small circle, tucked up by the screen's
  // edge, and lands in place over the first half of the motion; leaving
  // plays the same path back.
  const style = useAnimatedStyle(() => {
    const e = enter.value;
    const drop = reduce ? 1 : phase(e, 0, 0.5);
    const travel = (1 - drop) * -sign * (height.value + DROP_FROM);
    return {
      opacity: (reduce ? e : phase(e, 0, 0.18)) * opacity.value,
      transform: [
        { translateX: dragX.value },
        { translateY: y.value + dragY.value + travel },
        { scale: scale.value * (0.6 + 0.4 * drop) },
      ],
    };
  });

  // As it lands, the pill widens from a circle around the status, out from
  // the center. Only transforms move: two rounded caps slide apart and the
  // straight middle stretches between them, so the corners never distort.
  const shape = useDerivedValue(() => {
    const full = layoutWidth.value;
    const rest = restWidth.value;
    const start = Math.min(rest, Math.max(MORPH_START, height.value));
    // Widening starts as the drop slows, so the two read as one motion.
    const grow = reduce ? 1 : phase(enter.value, 0.2, 0.85);
    const width = start + (rest - start) * grow;
    const middle = full - CAP * 2;
    return {
      stretch: middle > 0 ? Math.max(0, width - CAP * 2) / middle : 1,
      shift: (full - width) / 2,
    };
  });
  const middleStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: shape.value.stretch }],
  }));
  // Squeezing also squeezes the middle's shadow into a dark sliver, so its
  // shadow fades in with its width.
  const middleShadowStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, shape.value.stretch * 3),
    transform: [{ scaleX: shape.value.stretch }],
  }));
  const leftCapStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shape.value.shift }],
  }));
  const rightCapStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -shape.value.shift }],
  }));
  // The status rides the left cap, so it stays centered in the circle.
  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shape.value.shift }],
  }));
  // The words come in once the pill has room, and fade out first on the way back.
  const textStyle = useAnimatedStyle(() => ({
    opacity: reduce ? 1 : phase(enter.value, 0.55, 0.95),
  }));

  const onLayout = ({
    nativeEvent,
  }: {
    nativeEvent: { layout: { width: number; height: number } };
  }) => {
    const { width, height: tall } = nativeEvent.layout;
    height.value = tall;
    layoutWidth.value = width;
    onMeasure(item.id, { width, height: tall });
    if (!measured.current) {
      // The morph waits for the first layout, so it knows its full width.
      measured.current = true;
      restWidth.value = width;
      enter.value = withTiming(1, reduce ? FADE : ENTER);
      return;
    }
    // A new status or title glides the pill to its new width.
    restWidth.value = reduce ? width : withTiming(width, REFLOW);
  };

  return (
    <Animated.View
      pointerEvents={!item.dismissed && interactive ? "box-none" : "none"}
      style={[
        position === "top" ? styles.slotTop : styles.slotBottom,
        { zIndex },
        style,
      ]}
    >
      <GestureDetector gesture={pan}>
        <Pressable
          onPress={onToggle}
          onLayout={onLayout}
          accessibilityRole={item.status === "error" ? "alert" : "text"}
          accessibilityLiveRegion={
            item.status === "error" ? "assertive" : "polite"
          }
          accessibilityHint={item.dismissible ? "Swipe to dismiss" : undefined}
          style={{ maxWidth: window.width - EDGE * 2 }}
        >
          {/* Every piece's shadow goes down before any fill, so the joins
              disappear and the shadows add up to the whole pill's. */}
          <PillPieces
            shadow
            middle={middleShadowStyle}
            left={leftCapStyle}
            right={rightCapStyle}
          />
          <PillPieces
            middle={middleStyle}
            left={leftCapStyle}
            right={rightCapStyle}
          />
          <Animated.View style={rowStyle}>
            <ToastContent item={item} reduce={reduce} textStyle={textStyle} />
          </Animated.View>
        </Pressable>
      </GestureDetector>
    </Animated.View>
  );
}

type PieceStyle = ReturnType<typeof useAnimatedStyle>;

/** The pill as two rounded caps and a straight middle that stretches. */
function PillPieces({
  shadow = false,
  middle,
  left,
  right,
}: {
  shadow?: boolean;
  middle: PieceStyle;
  left: PieceStyle;
  right: PieceStyle;
}) {
  // The shadow pieces only cast; the fills on top carry the border.
  const look = shadow ? styles.shadow : undefined;
  const edge = (sides: string) =>
    shadow ? "bg-background" : `${sides} border-border bg-background`;
  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.middle, look, middle]}
        className={edge("border-y")}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.capLeft, look, left]}
        className={edge("border-y border-l")}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.capRight, look, right]}
        className={edge("border-y border-r")}
      />
    </>
  );
}

/** The row inside a toast: status, words and an optional action. */
function ToastContent({
  item,
  reduce,
  textStyle,
}: {
  item: ToastItem;
  reduce: boolean;
  textStyle?: ReturnType<typeof useAnimatedStyle>;
}) {
  return (
    <View className="flex-row items-center gap-2.5 py-2.5 pl-2.5 pr-4">
      <StatusBadge status={item.status} reduce={reduce} />
      <Animated.View
        style={textStyle}
        className="shrink flex-row items-center gap-2.5"
      >
        <View className="shrink">
          <RollText
            text={item.title}
            className="text-sm font-medium text-foreground"
            reduce={reduce}
            numberOfLines={2}
          />
          {item.description ? (
            <Text numberOfLines={3} className="text-xs text-muted">
              {item.description}
            </Text>
          ) : null}
        </View>
        {item.action ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              item.action?.onPress();
              toast.dismiss(item.id);
            }}
            className="ml-1 h-7 items-center justify-center rounded-full bg-primary px-3 active:opacity-80"
          >
            <Text className="text-xs font-medium text-on-primary">
              {item.action.label}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

/**
 * A solid edge of the front toast's shape, peeking out behind it to show
 * more toasts are waiting. It follows the front toast's size.
 */
function Peek({
  depth,
  size,
  shown,
  position,
  reduce,
}: {
  depth: number;
  size: Size;
  shown: boolean;
  position: Position;
  reduce: boolean;
}) {
  const sign = position === "top" ? 1 : -1;
  const width = useSharedValue(size.width);
  const height = useSharedValue(size.height);
  const visible = useSharedValue(shown ? 1 : 0);

  useEffect(() => {
    const config = reduce ? { duration: 0 } : REFLOW;
    width.value = withTiming(size.width, config);
    height.value = withTiming(size.height, config);
  }, [height, reduce, size.height, size.width, width]);
  useEffect(() => {
    visible.value = withTiming(shown ? 1 : 0, reduce ? FADE : REFLOW);
  }, [reduce, shown, visible]);

  const style = useAnimatedStyle(() => ({
    width: width.value,
    height: height.value,
    opacity: visible.value,
    transform: [
      { translateY: sign * depth * PEEK * visible.value },
      { scale: 1 - depth * SHRINK },
    ],
  }));

  return (
    <View
      pointerEvents="none"
      style={[
        position === "top" ? styles.slotTop : styles.slotBottom,
        { zIndex: 100 - depth },
      ]}
    >
      <Animated.View
        style={[
          styles.pill,
          { transformOrigin: position === "top" ? "50% 100%" : "50% 0%" },
          style,
        ]}
        className="border border-border bg-background"
      />
    </View>
  );
}

const BADGE: Record<
  Exclude<ToastStatus, "neutral" | "loading">,
  { className: string; glyph: (color: string) => ReactNode }
> = {
  success: {
    className: "bg-primary",
    glyph: (color) => <CheckGlyph size={14} color={color} strokeWidth={2.8} />,
  },
  info: {
    className: "bg-primary",
    glyph: (color) => <InfoGlyph size={14} color={color} strokeWidth={2.8} />,
  },
  error: {
    className: "bg-destructive",
    glyph: (color) => (
      <ExclaimGlyph size={14} color={color} strokeWidth={2.8} />
    ),
  },
};

/** The status in a filled circle; it crossfades when the status changes. */
function StatusBadge({
  status,
  reduce,
}: {
  status: ToastStatus;
  reduce: boolean;
}) {
  const { color: onPrimary } = useResolveClassNames("text-on-primary");
  const { color: primary } = useResolveClassNames("text-primary");
  const shown = useSharedValue(1);
  const [current, setCurrent] = useState(status);

  // Fade the old mark out, swap, fade the new one in.
  useEffect(() => {
    if (status === current) return;
    if (reduce) {
      setCurrent(status);
      return;
    }
    shown.value = withTiming(0, { duration: 90 }, (done) => {
      if (done) scheduleOnRN(setCurrent, status);
    });
  }, [current, reduce, shown, status]);
  useEffect(() => {
    shown.value = withTiming(1, { duration: 160, easing: EASE_OUT });
  }, [current, shown]);

  const style = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ scale: 0.7 + 0.3 * shown.value }],
  }));

  if (current === "neutral" && status === "neutral") return null;

  return (
    <Animated.View
      style={[styles.badge, style]}
      className={
        current === "loading" || current === "neutral"
          ? "bg-primary/10"
          : BADGE[current].className
      }
    >
      {current === "loading" ? (
        <SpinGlyph size={14} color={primary as string} reduce={reduce} />
      ) : current === "neutral" ? null : (
        BADGE[current].glyph(onPrimary as string)
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { zIndex: 1000, elevation: 1000 },
  anchorTop: { flex: 1 },
  anchorBottom: { flex: 1, justifyContent: "flex-end" },
  slotTop: {
    position: "absolute",
    top: 0,
    left: EDGE,
    right: EDGE,
    alignItems: "center",
  },
  slotBottom: {
    position: "absolute",
    bottom: 0,
    left: EDGE,
    right: EDGE,
    alignItems: "center",
  },
  pill: { borderRadius: CAP, minHeight: 44, boxShadow: SHADOW },
  shadow: { boxShadow: SHADOW },
  middle: { position: "absolute", top: 0, bottom: 0, left: CAP, right: CAP },
  capLeft: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: CAP,
    borderTopLeftRadius: CAP,
    borderBottomLeftRadius: CAP,
  },
  capRight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: CAP,
    borderTopRightRadius: CAP,
    borderBottomRightRadius: CAP,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
