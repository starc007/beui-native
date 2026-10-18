import {
  Children,
  createContext,
  type ReactNode,
  type Ref,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type TextProps,
  View,
  type ViewProps,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { ChevronDownGlyph, ReplyGlyph } from "../../primitives/agent-icons";
import { FadeEdge } from "../../primitives/fade-edge";
import {
  EASE_OUT,
  SPRING_LAYOUT,
  SPRING_PRESS,
  SPRING_SWAP,
} from "../../styles/motion";

export type MessageBubbleVariant =
  | "solid"
  | "soft"
  | "tint"
  | "outline"
  | "ghost"
  | "danger";
export type MessageBubbleAlign = "start" | "end";

/** Which side a message sits on. Message provides it; bubbles default to it. */
export const MessageSideContext = createContext<MessageBubbleAlign | undefined>(
  undefined,
);

type BubbleContextValue = { variant: MessageBubbleVariant };
const BubbleContext = createContext<BubbleContextValue>({ variant: "soft" });

// Full class strings, so Uniwind can see every token at build time.
const SURFACE_CLASS: Record<MessageBubbleVariant, string> = {
  solid: "bg-foreground",
  soft: "bg-surface",
  tint: "bg-primary/10",
  outline: "border border-border-strong bg-background",
  ghost: "",
  danger: "bg-destructive/10",
};
const TEXT_CLASS: Record<MessageBubbleVariant, string> = {
  solid: "text-background",
  soft: "text-foreground",
  tint: "text-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  danger: "text-destructive",
};

// One restrained overshoot as the surface pops out of its corner.
const BUBBLE_POP = {
  stiffness: 520,
  damping: 27,
  mass: 0.52,
  reduceMotion: ReduceMotion.System,
};
const POP_FADE = { duration: 120, easing: EASE_OUT };
const CONTENT_DELAY = 40;
const LINE_HEIGHT = 24;
// How far to drag before letting go replies.
const REPLY_AT = 56;

export type MessageBubbleTextProps = TextProps & { className?: string };

/** Body text in the bubble's color. Plain strings are wrapped in it for you. */
export function MessageBubbleText({
  className = "",
  ...props
}: MessageBubbleTextProps) {
  const { variant } = useContext(BubbleContext);
  return (
    <Text
      className={`text-sm leading-6 ${TEXT_CLASS[variant]} ${className}`}
      {...props}
    />
  );
}

function wrapText(children: ReactNode) {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <MessageBubbleText>{child}</MessageBubbleText>
    ) : (
      child
    ),
  );
}

export type MessageBubbleProps = Omit<ViewProps, "children"> & {
  /** Defaults to "soft". */
  variant?: MessageBubbleVariant;
  /** Defaults to the surrounding Message's side, then "start". */
  align?: MessageBubbleAlign;
  /** Pops the surface out of its corner once, on mount. Defaults to false. */
  animateIn?: boolean;
  /** Makes the whole bubble tappable, with press feedback. */
  onPress?: PressableProps["onPress"];
  /** Lifts the bubble before firing, like a context menu opening. */
  onLongPress?: PressableProps["onLongPress"];
  /**
   * Swipe the bubble toward the middle of the screen to reply. A reply arrow
   * grows as you drag; letting go past it calls this.
   */
  onReply?: () => void;
  /** Classes for the bubble itself, such as padding or a max width. */
  contentClassName?: string;
  /** Pops in without motion, independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
  children?: ReactNode;
  ref?: Ref<View>;
};

/**
 * A chat bubble in one of six surfaces. Its surface pops out of the corner on
 * its side, and plain text inside takes the bubble's color.
 */
export function MessageBubble({
  variant = "soft",
  align: alignProp,
  animateIn = false,
  onPress,
  onLongPress,
  onReply,
  contentClassName = "",
  disableAnimation = false,
  className = "",
  children,
  accessibilityLabel,
  accessibilityHint,
  ref,
  ...props
}: MessageBubbleProps) {
  const side = useContext(MessageSideContext);
  const align = alignProp ?? side ?? "start";
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const pop = animateIn && !reduce;
  const scale = useSharedValue(pop ? 0.92 : 1);
  const surfaceOpacity = useSharedValue(pop ? 0 : 1);
  const contentOpacity = useSharedValue(pop ? 0 : 1);
  const pressed = useSharedValue(1);
  const drag = useSharedValue(0);
  const armed = useSharedValue(0);
  const ghost = variant === "ghost";
  // Toward the middle of the screen: right for start bubbles, left for end.
  const direction = align === "end" ? -1 : 1;
  const { color: muted } = useResolveClassNames("text-muted");
  const interactive = Boolean(onPress || onLongPress);

  // Plays once, on mount.
  useEffect(() => {
    if (!pop) return;
    scale.value = withSpring(1, BUBBLE_POP);
    surfaceOpacity.value = withTiming(1, POP_FADE);
    contentOpacity.value = withDelay(CONTENT_DELAY, withTiming(1, POP_FADE));
  }, []);

  const surfaceStyle = useAnimatedStyle(() => ({
    opacity: surfaceOpacity.value,
    transform: [{ scale: scale.value * pressed.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: pressed.value }],
  }));

  const reply = () => onReply?.();
  const swipe = Gesture.Pan()
    .enabled(Boolean(onReply))
    .activeOffsetX(direction > 0 ? [-999, 12] : [-12, 999])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      const pull = Math.max(0, event.translationX * direction);
      // Follows the finger up to the threshold, then resists.
      const travel =
        pull < REPLY_AT ? pull : REPLY_AT + (pull - REPLY_AT) * 0.25;
      drag.value = travel * direction;
      const nowArmed = pull >= REPLY_AT ? 1 : 0;
      if (nowArmed !== armed.value) {
        armed.value = nowArmed;
      }
    })
    .onEnd(() => {
      if (armed.value === 1) scheduleOnRN(reply);
      armed.value = 0;
      drag.value = withSpring(0, SPRING_SWAP);
    });

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value }],
  }));
  const arrowStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.abs(drag.value) / REPLY_AT);
    return {
      opacity: progress,
      transform: [
        {
          scale: withSpring(
            armed.value ? 1.15 : 0.6 + progress * 0.4,
            SPRING_SWAP,
          ),
        },
      ],
    };
  });

  const bubble = (
    <View
      style={[
        ghost ? styles.ghost : styles.bubble,
        align === "end" ? styles.end : styles.start,
      ]}
      className={ghost ? contentClassName : `px-3.5 py-2.5 ${contentClassName}`}
    >
      {ghost ? null : (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.surface,
            { transformOrigin: [align === "end" ? "100%" : "0%", "100%", 0] },
            surfaceStyle,
          ]}
          className={SURFACE_CLASS[variant]}
        />
      )}
      <Animated.View style={contentStyle}>{wrapText(children)}</Animated.View>
    </View>
  );

  return (
    <BubbleContext.Provider value={{ variant }}>
      <View
        ref={ref}
        style={[
          styles.row,
          { alignItems: align === "end" ? "flex-end" : "flex-start" },
        ]}
        className={className}
        accessibilityActions={
          onReply ? [{ name: "reply", label: "Reply" }] : undefined
        }
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "reply") onReply?.();
        }}
        {...props}
      >
        {onReply ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.arrow,
              align === "end" ? styles.arrowEnd : styles.arrowStart,
              arrowStyle,
            ]}
          >
            <ReplyGlyph size={18} color={muted} />
          </Animated.View>
        ) : null}
        <GestureDetector gesture={swipe}>
          <Animated.View
            style={[
              ghost ? styles.ghost : styles.swipe,
              align === "end" ? styles.end : styles.start,
              dragStyle,
            ]}
          >
            {interactive ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityHint}
                onPress={onPress}
                onLongPress={
                  onLongPress
                    ? (event) => {
                        if (!reduce) {
                          pressed.value = withSequence(
                            withSpring(1.04, SPRING_PRESS),
                            withSpring(1, SPRING_PRESS),
                          );
                        }
                        onLongPress(event);
                      }
                    : undefined
                }
                onPressIn={() => {
                  if (!reduce) pressed.value = withSpring(0.98, SPRING_PRESS);
                }}
                onPressOut={() => {
                  pressed.value = withSpring(1, SPRING_PRESS);
                }}
                style={[
                  styles.pressable,
                  align === "end" ? styles.end : styles.start,
                ]}
              >
                {bubble}
              </Pressable>
            ) : (
              bubble
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </BubbleContext.Provider>
  );
}

export type MessageBubbleGroupProps = ViewProps & {
  /** Space between bubbles: 6 (compact) or 12 points. Defaults to "compact". */
  spacing?: "compact" | "default";
  className?: string;
};

/** Stacks consecutive bubbles from one sender. */
export function MessageBubbleGroup({
  spacing = "compact",
  className = "",
  ...props
}: MessageBubbleGroupProps) {
  return (
    <View
      className={`w-full ${spacing === "compact" ? "gap-1.5" : "gap-3"} ${className}`}
      {...props}
    />
  );
}

export type MessageBubbleCollapsibleProps = {
  open?: boolean;
  /** Defaults to false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Lines shown while collapsed, at the bubble's 24 point line height. Defaults to 4. */
  collapsedLines?: number;
  /** Defaults to "Show more". */
  moreLabel?: string;
  /** Defaults to "Show less". */
  lessLabel?: string;
  /** Pops open without motion, independently of the system preference. */
  disableAnimation?: boolean;
  children: ReactNode;
};

/**
 * Clamps a long bubble to a few lines with a soft edge, and springs it open
 * to its full height. The toggle only appears when the content overflows.
 */
export function MessageBubbleCollapsible({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  collapsedLines = 4,
  moreLabel = "Show more",
  lessLabel = "Show less",
  disableAnimation = false,
  children,
}: MessageBubbleCollapsibleProps) {
  const { variant } = useContext(BubbleContext);
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const [full, setFull] = useState(0);
  const collapsed = collapsedLines * LINE_HEIGHT;
  const overflows = full > collapsed + 1;
  const height = useSharedValue(collapsed);
  const turn = useSharedValue(open ? 1 : 0);
  const measured = full > 0;
  const surface = useResolveClassNames(
    SURFACE_CLASS[variant] || "bg-background",
  );
  const { color: tone } = useResolveClassNames(TEXT_CLASS[variant]);

  useEffect(() => {
    if (!measured) return;
    const target = open || !overflows ? full : collapsed;
    height.value = reduce ? target : withSpring(target, SPRING_LAYOUT);
    turn.value = reduce
      ? open
        ? 1
        : 0
      : withSpring(open ? 1 : 0, SPRING_SWAP);
  }, [collapsed, full, height, measured, open, overflows, reduce, turn]);

  const clipStyle = useAnimatedStyle(() => ({ height: height.value }));
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, (full - height.value) / LINE_HEIGHT)),
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 180}deg` }],
  }));

  const toggle = () => {
    const next = !open;
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <View>
      <Animated.View style={[styles.clip, measured && clipStyle]}>
        {/* Keeps its full height inside the clip, so the clamp knows how far to open. */}
        <View
          style={styles.measure}
          onLayout={({ nativeEvent }) => setFull(nativeEvent.layout.height)}
        >
          {wrapText(children)}
        </View>
        {overflows ? (
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, fadeStyle]}
          >
            <FadeEdge
              color={surface.backgroundColor}
              height={LINE_HEIGHT * 1.5}
            />
          </Animated.View>
        ) : null}
      </Animated.View>
      {overflows ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={toggle}
          hitSlop={8}
          style={styles.toggle}
        >
          <Text
            className={`text-xs font-medium ${TEXT_CLASS[variant]} opacity-70`}
          >
            {open ? lessLabel : moreLabel}
          </Text>
          <Animated.View style={chevronStyle}>
            <ChevronDownGlyph size={12} color={tone} />
          </Animated.View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: "100%" },
  bubble: { minWidth: 36, borderRadius: 16 },
  ghost: { width: "100%" },
  pressable: { maxWidth: "100%" },
  swipe: { maxWidth: "82%" },
  arrow: { position: "absolute", top: 0, bottom: 0, justifyContent: "center" },
  arrowStart: { left: 4 },
  arrowEnd: { right: 4 },
  start: { alignSelf: "flex-start" },
  end: { alignSelf: "flex-end" },
  surface: { borderRadius: 16 },
  clip: { overflow: "hidden" },
  measure: { flexShrink: 0 },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    minHeight: 24,
    alignSelf: "flex-start",
  },
});
