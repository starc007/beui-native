import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useResolveClassNames } from "uniwind";
import { usePresence } from "../../hooks/use-presence";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { ArrowGlyph, CrossGlyph } from "../../primitives/agent-icons";
import { Overlay } from "../../primitives/overlay";
import { EASE_OUT } from "../../styles/motion";

/** The card rising into place and settling, without overshoot. */
const SPRING_OPEN = {
  stiffness: 380,
  damping: 38,
  mass: 0.8,
  reduceMotion: ReduceMotion.System,
} as const;
/** The card's height following a view change: quick, a touch of give. */
const SPRING_MORPH = {
  stiffness: 420,
  damping: 36,
  mass: 0.7,
  reduceMotion: ReduceMotion.System,
} as const;
const CLOSE = {
  duration: 220,
  easing: Easing.bezier(0.32, 0, 0.67, 0),
  reduceMotion: ReduceMotion.System,
} as const;
const VIEW_IN = { duration: 240, easing: EASE_OUT } as const;
const VIEW_OUT = { duration: 150, easing: EASE_OUT } as const;
/** How far to pull before letting go dismisses, and how fast a flick must be. */
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 900;
const EDGE = 12;

type ModalContextValue = {
  close: () => void;
  reduce: boolean;
};

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext(component: string) {
  const context = useContext(ModalContext);
  if (!context)
    throw new Error(`${component} must be used inside <MorphingModal>.`);
  return context;
}

export type MorphingModalProps = {
  /** The view to show, by name. `null` closes the modal. */
  view: string | null;
  onClose: () => void;
  /**
   * Called by the Android back button. Pass it on views reached from another
   * view, so back steps out of them; without it, back closes the modal.
   */
  onBack?: () => void;
  /** The current view's content. Give each view its own `view` name. */
  children: ReactNode;
  /**
   * The bottom safe-area inset. The card sits low over the home indicator,
   * close to the screen's curved corners, and keeps at least 12 points of
   * space. Defaults to 0.
   */
  bottomInset?: number;
  /** Whether a swipe down or a tap outside closes it. Defaults to true. */
  dismissible?: boolean;
  /** Read by screen readers when the modal opens. */
  accessibilityLabel?: string;
  className?: string;
  /** Opens, morphs and closes without motion, independently of the system preference. */
  disableAnimation?: boolean;
};

/**
 * A card that rises from the bottom of the screen and morphs its height as
 * you move between the views inside it, in the style of the Family wallet.
 * Each view fades and lifts into place while the card springs to its size.
 * Swipe it down, or tap outside, to close.
 */
export function MorphingModal({
  view,
  onClose,
  onBack,
  children,
  bottomInset = 0,
  dismissible = true,
  accessibilityLabel,
  className = "",
  disableAnimation = false,
}: MorphingModalProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const window = useWindowDimensions();
  const open = view !== null;

  // Stay mounted through the close, showing the last view.
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);
  const shown = useRef(view);
  if (view !== null) shown.current = view;
  // Each view's latest content, so a view leaves looking as it did, not as it
  // first appeared.
  const latest = useRef(new Map<string, ReactNode>());
  if (view !== null) latest.current.set(view, children);
  const items = usePresence(
    present ? shown.current : null,
    children,
    () => VIEW_OUT.duration,
  );

  const progress = useSharedValue(0);
  const drag = useSharedValue(0);
  const height = useSharedValue(0);
  const [measured, setMeasured] = useState(false);
  const measuredRef = useRef(false);

  const hide = useCallback(() => {
    latest.current.clear();
    setPresent(false);
    setMeasured(false);
    measuredRef.current = false;
    drag.value = 0;
  }, [drag]);

  useEffect(() => {
    if (!present) return;
    if (open) {
      if (!measured) return;
      progress.value = reduce
        ? withTiming(1, { duration: 160 })
        : withSpring(1, SPRING_OPEN);
    } else {
      progress.value = withTiming(
        0,
        reduce ? { duration: 140 } : CLOSE,
        (done) => {
          if (done) scheduleOnRN(hide);
        },
      );
    }
  }, [hide, measured, open, present, progress, reduce]);

  // The first size lands before the card rises; later ones morph.
  const onMeasure = useCallback(
    (next: number) => {
      if (!measuredRef.current) {
        height.value = next;
        measuredRef.current = true;
        setMeasured(true);
        return;
      }
      height.value = reduce ? next : withSpring(next, SPRING_MORPH);
    },
    [height, reduce],
  );

  const close = useCallback(() => {
    if (open) onClose();
  }, [onClose, open]);

  const travel = window.height * 0.6;
  const pan = Gesture.Pan()
    .enabled(dismissible && open)
    .activeOffsetY(10)
    .failOffsetX([-16, 16])
    .onUpdate((event) => {
      // Down follows the finger; up resists, so the card stays anchored.
      drag.value =
        event.translationY > 0
          ? event.translationY
          : -Math.sqrt(-event.translationY) * 3;
    })
    .onEnd((event) => {
      if (
        event.translationY > DISMISS_DISTANCE ||
        event.velocityY > DISMISS_VELOCITY
      ) {
        scheduleOnRN(close);
      } else {
        drag.value = withSpring(0, SPRING_OPEN);
      }
    });

  const panelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    if (reduce) return { opacity: p, transform: [{ translateY: drag.value }] };
    return {
      opacity: Math.min(1, p * 2),
      transform: [
        { translateY: (1 - p) * travel + Math.max(-40, drag.value) },
        { scale: 0.96 + 0.04 * Math.min(1, p) },
      ],
    };
  }, [reduce, travel]);
  const sizeStyle = useAnimatedStyle(() => ({ height: height.value }));
  const scrimStyle = useAnimatedStyle(() => ({
    // The scrim lightens as the card is pulled away.
    opacity:
      Math.min(1, progress.value) *
      (1 - Math.min(0.6, Math.max(0, drag.value) / 400)),
  }));

  if (!present) return null;

  return (
    <Overlay onRequestClose={() => (onBack ? onBack() : close())}>
      <Animated.View
        style={[StyleSheet.absoluteFill, scrimStyle]}
        className="bg-black/25"
      >
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          style={StyleSheet.absoluteFill}
          onPress={dismissible ? close : undefined}
        />
      </Animated.View>
      <View
        pointerEvents="box-none"
        style={[
          styles.layer,
          { paddingBottom: Math.max(EDGE, bottomInset - 20) },
        ]}
      >
        <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityViewIsModal
            accessibilityLabel={accessibilityLabel}
            style={[styles.card, panelStyle]}
            className={`border border-border bg-background ${className}`}
          >
            <ModalContext.Provider value={{ close, reduce }}>
              <Animated.View style={[styles.clip, sizeStyle]}>
                {items.map((item) => (
                  <ViewLayer
                    key={item.key}
                    appear={item.appear && measured}
                    exiting={item.exiting}
                    reduce={reduce}
                    onMeasure={item.exiting ? undefined : onMeasure}
                  >
                    {latest.current.get(item.key) ?? item.value}
                  </ViewLayer>
                ))}
              </Animated.View>
            </ModalContext.Provider>
          </Animated.View>
        </GestureDetector>
      </View>
    </Overlay>
  );
}

/**
 * One view inside the card. It sits on top of the others and measures its
 * own height, so the card can spring to it while the old view fades out
 * underneath.
 */
function ViewLayer({
  appear,
  exiting,
  reduce,
  onMeasure,
  children,
}: {
  appear: boolean;
  exiting: boolean;
  reduce: boolean;
  onMeasure?: (height: number) => void;
  children: ReactNode;
}) {
  const shown = useSharedValue(appear ? 0 : 1);

  useEffect(() => {
    const target = exiting ? 0 : 1;
    shown.value = withTiming(target, exiting ? VIEW_OUT : VIEW_IN);
  }, [exiting, shown]);

  const style = useAnimatedStyle(() => {
    const p = shown.value;
    if (reduce) return { opacity: p };
    // In from slightly below, out slightly upward.
    const offset = exiting ? -10 : 10;
    return {
      opacity: p,
      transform: [{ translateY: (1 - p) * offset }, { scale: 0.98 + 0.02 * p }],
    };
  }, [exiting, reduce]);

  return (
    <Animated.View
      pointerEvents={exiting ? "none" : "auto"}
      accessibilityElementsHidden={exiting}
      importantForAccessibility={exiting ? "no-hide-descendants" : "auto"}
      onLayout={({ nativeEvent }) => onMeasure?.(nativeEvent.layout.height)}
      style={[styles.view, style]}
    >
      {children}
    </Animated.View>
  );
}

export type MorphingModalHeaderProps = {
  title?: string;
  /** Shown before the title, such as a glyph for the view. */
  icon?: ReactNode;
  /** Shows a back button that calls this, for views reached from another. */
  onBack?: () => void;
  className?: string;
};

/**
 * The top row of a view: an optional back button and title, and a close
 * button. Every view can use one, so the controls stay put as views change.
 */
export function MorphingModalHeader({
  title,
  icon,
  onBack,
  className = "",
}: MorphingModalHeaderProps) {
  const { close } = useModalContext("MorphingModalHeader");
  const { color: muted } = useResolveClassNames("text-muted");

  return (
    <View className={`mb-4 min-h-8 flex-row items-center gap-3 ${className}`}>
      {onBack ? (
        <HeaderButton accessibilityLabel="Back" onPress={onBack}>
          <ArrowGlyph back size={16} color={muted} strokeWidth={2.2} />
        </HeaderButton>
      ) : null}
      {icon}
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        className="flex-1 text-[17px] font-semibold text-foreground"
      >
        {title}
      </Text>
      <HeaderButton accessibilityLabel="Close" onPress={close}>
        <CrossGlyph size={14} color={muted} strokeWidth={2.4} />
      </HeaderButton>
    </View>
  );
}

function HeaderButton({
  accessibilityLabel,
  onPress,
  children,
}: {
  accessibilityLabel: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      onPress={onPress}
      className="h-8 w-8 items-center justify-center rounded-full bg-foreground/5 active:bg-foreground/10"
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: EDGE,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 36,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  clip: { overflow: "hidden" },
  view: { position: "absolute", top: 0, left: 0, right: 0, padding: 20 },
});
