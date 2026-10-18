import { type ReactNode, type Ref, useContext, useEffect } from "react";
import { StyleSheet, Text, View, type ViewProps } from "react-native";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { usePresence } from "../../hooks/use-presence";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import {
  AlertGlyph,
  CheckGlyph,
  ClockGlyph,
  DoubleCheckGlyph,
} from "../../primitives/agent-icons";
import { RollText } from "../../primitives/roll-text";
import { EASE_OUT, SPRING_SWAP } from "../../styles/motion";
import { MessageSideContext } from "../message-bubble/message-bubble";

export type MessageFrom = "user" | "assistant";

// The row rises out of its trailing corner as it's sent.
const MESSAGE_POP_UP = {
  stiffness: 480,
  damping: 32,
  mass: 0.62,
  reduceMotion: ReduceMotion.System,
};
const RISE = 8;

export type MessageProps = Omit<ViewProps, "children"> & {
  from: MessageFrom;
  /** Pops the row up from its trailing corner once, on mount. Defaults to false. */
  animateIn?: boolean;
  /** Appears without motion, independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
  children: ReactNode;
  ref?: Ref<View>;
};

/**
 * One message row: an optional avatar beside MessageContent. User rows sit on
 * the trailing side, and bubbles inside follow the row's side.
 */
export function Message({
  from,
  animateIn = false,
  disableAnimation = false,
  className = "",
  style,
  children,
  ref,
  ...props
}: MessageProps) {
  const reducedMotion = useReducedMotionPreference();
  const pop = animateIn && !reducedMotion && !disableAnimation;
  const progress = useSharedValue(pop ? 0 : 1);
  const user = from === "user";

  // Plays once, on mount.
  useEffect(() => {
    if (pop) progress.value = withSpring(1, MESSAGE_POP_UP);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: Math.min(1, p),
      transform: [{ translateY: (1 - p) * RISE }, { scale: 0.95 + p * 0.05 }],
    };
  });

  return (
    <MessageSideContext.Provider value={user ? "end" : "start"}>
      <Animated.View
        ref={ref}
        style={[
          styles.row,
          user && styles.reverse,
          { transformOrigin: [user ? "100%" : "0%", "100%", 0] },
          animatedStyle,
          style,
        ]}
        className={className}
        {...props}
      >
        {children}
      </Animated.View>
    </MessageSideContext.Provider>
  );
}

export type MessageGroupProps = ViewProps & {
  /** Space between rows: 6 (compact) or 16 points. Defaults to "compact". */
  spacing?: "compact" | "default";
  className?: string;
};

/** Stacks message rows. */
export function MessageGroup({
  spacing = "compact",
  className = "",
  ...props
}: MessageGroupProps) {
  return (
    <View
      className={`${spacing === "compact" ? "gap-1.5" : "gap-4"} ${className}`}
      {...props}
    />
  );
}

export type MessageAvatarProps = ViewProps & {
  /** Keeps the slot empty so grouped rows stay aligned. */
  placeholder?: boolean;
  className?: string;
  /** Initials, an image or an icon. Strings are styled for you. */
  children?: ReactNode;
};

/** A 28 point round avatar. */
export function MessageAvatar({
  placeholder = false,
  className = "",
  children,
  ...props
}: MessageAvatarProps) {
  return (
    <View
      importantForAccessibility={placeholder ? "no-hide-descendants" : "auto"}
      accessibilityElementsHidden={placeholder}
      style={[styles.avatar, placeholder && styles.hidden]}
      className={`items-center justify-center overflow-hidden bg-surface ${className}`}
      {...props}
    >
      {placeholder ? null : typeof children === "string" ? (
        <Text className="text-xs font-medium text-muted">{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

/** The column beside the avatar, holding header, bubbles and footer. */
export function MessageContent({
  className = "",
  ...props
}: ViewProps & { className?: string }) {
  const side = useContext(MessageSideContext);
  return (
    <View
      style={[
        styles.content,
        { alignItems: side === "end" ? "flex-end" : "flex-start" },
      ]}
      className={`gap-1.5 ${className}`}
      {...props}
    />
  );
}

function metaRow(minHeight: boolean) {
  return function MetaRow({
    className = "",
    children,
    ...props
  }: ViewProps & { className?: string }) {
    return (
      <View
        style={minHeight && styles.footer}
        className={`flex-row items-center gap-1.5 px-1 ${className}`}
        {...props}
      >
        {typeof children === "string" ? (
          <Text className="text-[11px] text-muted">{children}</Text>
        ) : (
          children
        )}
      </View>
    );
  };
}

/** A small line above the bubbles: a name, a time. */
export const MessageHeader = metaRow(false);
/** A small line below the bubbles: delivery state, actions. */
export const MessageFooter = metaRow(true);

export type MessageDelivery =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

const DELIVERY_LABEL: Record<MessageDelivery, string> = {
  sending: "Sending",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Not delivered",
};

/** The delivery icon, swapping with a quick scale as the state moves on. */
function DeliveryIcon({
  delivery,
  appear,
  exiting,
  reduce,
}: {
  delivery: MessageDelivery;
  appear: boolean;
  exiting: boolean;
  reduce: boolean;
}) {
  const { color: muted } = useResolveClassNames("text-muted");
  const { color: primary } = useResolveClassNames("text-primary");
  const { color: destructive } = useResolveClassNames("text-destructive");
  const shown = useSharedValue(appear && !reduce ? 0 : 1);
  useEffect(() => {
    shown.value = reduce
      ? exiting
        ? 0
        : 1
      : withSpring(exiting ? 0 : 1, SPRING_SWAP);
  }, [exiting, reduce, shown]);
  const style = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ scale: 0.6 + shown.value * 0.4 }],
  }));
  const props = { size: 13, strokeWidth: 2 };
  return (
    <Animated.View style={[styles.deliveryIcon, style]}>
      {delivery === "sending" ? (
        <ClockGlyph {...props} color={muted} />
      ) : delivery === "sent" ? (
        <CheckGlyph {...props} color={muted} />
      ) : delivery === "failed" ? (
        <AlertGlyph {...props} color={destructive} />
      ) : (
        <DoubleCheckGlyph
          {...props}
          color={delivery === "read" ? primary : muted}
        />
      )}
    </Animated.View>
  );
}

export type MessageStatusProps = ViewProps & {
  /** When the message was sent, already formatted, such as "9:41". */
  time?: string;
  /** Where the message is. The icon and label roll as it changes. */
  delivery?: MessageDelivery;
  /** Shows the delivery word beside its icon. Defaults to true. */
  showLabel?: boolean;
  disableAnimation?: boolean;
};

/**
 * The time and delivery state under a message, such as "9:41 · Delivered"
 * with two checks. As the state moves on, the label rolls and the icon swaps.
 */
export function MessageStatus({
  time,
  delivery,
  showLabel = true,
  disableAnimation = false,
  ...props
}: MessageStatusProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const icons = usePresence(
    delivery ?? null,
    delivery as MessageDelivery,
    () => (reduce ? 0 : 220),
  );
  const spoken = [time, delivery ? DELIVERY_LABEL[delivery] : undefined]
    .filter(Boolean)
    .join(", ");
  return (
    <MessageFooter
      accessible
      accessibilityLabel={spoken}
      accessibilityLiveRegion="polite"
      {...props}
    >
      {time ? (
        <Text className="text-[11px] text-muted" style={styles.tabular}>
          {time}
        </Text>
      ) : null}
      {time && delivery && showLabel ? (
        <Text className="text-[11px] text-muted">·</Text>
      ) : null}
      {delivery && showLabel ? (
        <RollText
          text={DELIVERY_LABEL[delivery]}
          className={`text-[11px] ${delivery === "failed" ? "text-destructive" : "text-muted"}`}
          reduce={reduce}
        />
      ) : null}
      {delivery ? (
        <View style={styles.deliverySlot}>
          {icons.map((item) => (
            <DeliveryIcon
              key={item.key}
              delivery={item.value}
              appear={item.appear}
              exiting={item.exiting}
              reduce={reduce}
            />
          ))}
        </View>
      ) : null}
    </MessageFooter>
  );
}

/** A centered pill between messages, for dates and system notes. */
export function MessageMarker({
  className = "",
  children,
  ...props
}: ViewProps & { className?: string }) {
  return (
    <View
      className={`max-w-[88%] self-center rounded-full bg-surface px-2.5 py-1 ${className}`}
      {...props}
    >
      {typeof children === "string" ? (
        <Text className="text-xs text-muted">{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const DOT_CYCLE = 1050;
const DOT_STAGGER = 140;

function TypingDot({
  index,
  color,
  reduce,
}: {
  index: number;
  color: string;
  reduce: boolean;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduce) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withDelay(
      index * DOT_STAGGER,
      withRepeat(
        withTiming(1, { duration: DOT_CYCLE / 2, easing: EASE_OUT }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(pulse);
  }, [index, pulse, reduce]);

  const style = useAnimatedStyle(() =>
    reduce
      ? { opacity: 0.45 }
      : {
          opacity: 0.28 + pulse.value * 0.57,
          transform: [{ translateY: -2 * pulse.value }],
        },
  );

  return (
    <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />
  );
}

export type MessageTypingProps = ViewProps & {
  /** Spoken in place of the dots. Defaults to "Responding". */
  label?: string;
  /** Color utility for the dots. Defaults to `text-muted`. */
  className?: string;
  disableAnimation?: boolean;
};

/** Three dots that rise and fade in turn while a reply is on its way. */
export function MessageTyping({
  label = "Responding",
  className = "text-muted",
  disableAnimation = false,
  ...props
}: MessageTypingProps) {
  const reducedMotion = useReducedMotionPreference();
  const { color } = useResolveClassNames(className);
  const tint = String(color ?? "gray");
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      style={styles.typing}
      {...props}
    >
      {[0, 1, 2].map((index) => (
        <TypingDot
          key={index}
          index={index}
          color={tint}
          reduce={reducedMotion || disableAnimation}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    width: "100%",
  },
  reverse: { flexDirection: "row-reverse" },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  hidden: { opacity: 0 },
  content: { flex: 1, minWidth: 0 },
  footer: { minHeight: 20 },
  typing: { flexDirection: "row", alignItems: "center", gap: 4, height: 20 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  deliverySlot: { width: 14, height: 14 },
  deliveryIcon: { position: "absolute", left: 0, top: 0 },
  tabular: { fontVariant: ["tabular-nums"] },
});
