import { Children, type ReactNode, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { usePresence } from "../../hooks/use-presence";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import {
  CheckGlyph,
  ChevronDownGlyph,
  CopyGlyph,
  RetryGlyph,
  ThumbGlyph,
} from "../../primitives/agent-icons";
import { Disclosure } from "../../primitives/disclosure";
import { EASE_OUT, SPRING_PRESS, SPRING_SWAP } from "../../styles/motion";
import {
  type CitationItem,
  CitationList,
  CitationStack,
} from "../citations/citations";

export type StreamingResponseStatus = "streaming" | "complete" | "error";
export type StreamingResponseFeedback = "up" | "down" | null;

const BAR_IN = { duration: 220, easing: EASE_OUT };
const BAR_IN_REDUCED = { duration: 120 };
const COPIED_FOR = 1600;

function ActionButton({
  label,
  pressed,
  reduce,
  onPress,
  children,
}: {
  label: string;
  pressed?: boolean;
  reduce: boolean;
  onPress: () => void;
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
      accessibilityState={
        pressed === undefined ? undefined : { selected: pressed }
      }
      hitSlop={8}
      onPress={onPress}
      onPressIn={() => {
        if (!reduce) scale.value = withSpring(0.9, SPRING_PRESS);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_PRESS);
      }}
    >
      <Animated.View
        style={[styles.action, style]}
        className={pressed ? "bg-surface" : ""}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

/** Copy trades places with a check, which rolls in from below. */
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
  const progress = useSharedValue(appear ? 0 : 1);
  useEffect(() => {
    const target = exiting ? 2 : 1;
    progress.value = reduce ? target : withSpring(target, SPRING_SWAP);
  }, [exiting, progress, reduce]);
  const style = useAnimatedStyle(() => {
    const away = Math.abs(1 - progress.value);
    return {
      opacity: Math.max(0, 1 - away),
      transform: reduce
        ? []
        : [
            { translateY: (1 - progress.value) * 4 },
            { scale: 1 - away * 0.25 },
          ],
    };
  }, [reduce]);
  return (
    <Animated.View style={[styles.layer, style]}>{children}</Animated.View>
  );
}

function wrapText(children: ReactNode, className: string) {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      // Selectable, so a long press brings up the system copy and look-up menu.
      <Text selectable className={className}>
        {child}
      </Text>
    ) : (
      child
    ),
  );
}

export type StreamingResponseProps = Omit<ViewProps, "children"> & {
  /** Text, or the output of your Markdown renderer. Strings are styled for you. */
  children: ReactNode;
  /** Defaults to "streaming". Actions appear once it isn't. */
  status?: StreamingResponseStatus;
  /** Shows a copy button. Copy the text with your clipboard library here. */
  onCopy?: () => unknown;
  /** Shows a retry button. */
  onRetry?: () => void;
  feedback?: StreamingResponseFeedback;
  /** Defaults to null. */
  defaultFeedback?: StreamingResponseFeedback;
  /** Shows helpful and not helpful buttons once complete. */
  onFeedbackChange?: (feedback: StreamingResponseFeedback) => void;
  /** Sources behind the reply, shown as a stack and a count that opens the list. */
  sources?: CitationItem[];
  sourcesOpen?: boolean;
  /** Defaults to false. */
  defaultSourcesOpen?: boolean;
  onSourcesOpenChange?: (open: boolean) => void;
  /** Replaces opening a source's URL. */
  onOpenSource?: (item: CitationItem) => void;
  /** Defaults to true. */
  showActions?: boolean;
  /** Announces text as it arrives on Android. Turn off inside a live list. Defaults to true. */
  announce?: boolean;
  className?: string;
  /** Classes for the text column. */
  contentClassName?: string;
  /** Text classes applied to plain string children. */
  textClassName?: string;
  /** Shows the actions without motion, independently of the system preference. */
  disableAnimation?: boolean;
};

/**
 * An assistant reply that streams in, then settles with copy, retry and
 * feedback actions that rise in beneath it.
 */
export function StreamingResponse({
  children,
  status = "streaming",
  onCopy,
  onRetry,
  feedback: controlledFeedback,
  defaultFeedback = null,
  onFeedbackChange,
  sources = [],
  sourcesOpen: controlledSourcesOpen,
  defaultSourcesOpen = false,
  onSourcesOpenChange,
  onOpenSource,
  showActions = true,
  announce = true,
  className = "",
  contentClassName = "",
  textClassName = "text-sm leading-6 text-foreground",
  disableAnimation = false,
  ...props
}: StreamingResponseProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const streaming = status === "streaming";
  const complete = status === "complete";
  const [internalFeedback, setInternalFeedback] = useState(defaultFeedback);
  const feedback =
    controlledFeedback === undefined ? internalFeedback : controlledFeedback;
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const bar = useSharedValue(streaming ? 0 : 1);
  const { color: muted } = useResolveClassNames("text-muted");
  const { color: foreground } = useResolveClassNames("text-foreground");

  const [internalSourcesOpen, setInternalSourcesOpen] =
    useState(defaultSourcesOpen);
  const sourcesOpen = controlledSourcesOpen ?? internalSourcesOpen;
  const hasSources = sources.length > 0;
  const sourcesTurn = useSharedValue(sourcesOpen ? 1 : 0);
  useEffect(() => {
    sourcesTurn.value = reduce
      ? sourcesOpen
        ? 1
        : 0
      : withSpring(sourcesOpen ? 1 : 0, SPRING_SWAP);
  }, [reduce, sourcesOpen, sourcesTurn]);
  const sourcesChevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sourcesTurn.value * 180}deg` }],
  }));
  const toggleSources = () => {
    if (controlledSourcesOpen === undefined)
      setInternalSourcesOpen(!sourcesOpen);
    onSourcesOpenChange?.(!sourcesOpen);
  };

  const hasActions =
    showActions &&
    !streaming &&
    Boolean(hasSources || onCopy || onRetry || (complete && onFeedbackChange));

  useEffect(() => {
    if (!hasActions) {
      bar.value = 0;
      return;
    }
    bar.value = withTiming(1, reduce ? BAR_IN_REDUCED : BAR_IN);
  }, [bar, hasActions, reduce]);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const barStyle = useAnimatedStyle(
    () => ({
      opacity: bar.value,
      transform: [{ translateY: reduce ? 0 : (1 - bar.value) * 4 }],
    }),
    [reduce],
  );

  const copy = async () => {
    await onCopy?.();
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_FOR);
  };

  const rate = (next: Exclude<StreamingResponseFeedback, null>) => {
    const value = feedback === next ? null : next;
    if (controlledFeedback === undefined) setInternalFeedback(value);
    onFeedbackChange?.(value);
  };

  const copyIcons = usePresence(copied ? "check" : "copy", copied, () => 260);

  return (
    <View
      accessibilityState={{ busy: streaming }}
      className={className}
      {...props}
    >
      <View
        accessibilityLiveRegion={announce && streaming ? "polite" : "none"}
        className={`gap-3 ${contentClassName}`}
      >
        {wrapText(children, textClassName)}
      </View>
      {hasActions ? (
        <Animated.View style={[styles.bar, barStyle]}>
          {onCopy ? (
            <ActionButton
              label={copied ? "Copied" : "Copy"}
              reduce={reduce}
              onPress={() => void copy()}
            >
              {copyIcons.map((item) => (
                <SwapIcon
                  key={item.key}
                  appear={item.appear}
                  exiting={item.exiting}
                  reduce={reduce}
                >
                  {item.value ? (
                    <CheckGlyph size={14} color={foreground} />
                  ) : (
                    <CopyGlyph size={14} color={muted} />
                  )}
                </SwapIcon>
              ))}
            </ActionButton>
          ) : null}
          {onRetry ? (
            <ActionButton label="Retry" reduce={reduce} onPress={onRetry}>
              <RetryGlyph size={14} color={muted} />
            </ActionButton>
          ) : null}
          {complete && onFeedbackChange ? (
            <>
              <ActionButton
                label="Helpful"
                pressed={feedback === "up"}
                reduce={reduce}
                onPress={() => rate("up")}
              >
                <ThumbGlyph
                  size={14}
                  color={feedback === "up" ? foreground : muted}
                />
              </ActionButton>
              <ActionButton
                label="Not helpful"
                pressed={feedback === "down"}
                reduce={reduce}
                onPress={() => rate("down")}
              >
                <ThumbGlyph
                  down
                  size={14}
                  color={feedback === "down" ? foreground : muted}
                />
              </ActionButton>
            </>
          ) : null}
          {hasSources ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: sourcesOpen }}
              accessibilityLabel={`${sources.length} ${sources.length === 1 ? "source" : "sources"}`}
              onPress={toggleSources}
              hitSlop={6}
              style={styles.sources}
            >
              <CitationStack citations={sources} />
              <Text className="text-xs text-muted" style={styles.tabular}>
                {sources.length} {sources.length === 1 ? "source" : "sources"}
              </Text>
              <Animated.View style={sourcesChevron}>
                <ChevronDownGlyph size={12} color={muted} />
              </Animated.View>
            </Pressable>
          ) : null}
        </Animated.View>
      ) : null}
      {hasSources ? (
        <Disclosure open={sourcesOpen && hasActions} reduce={reduce}>
          <View className="mt-2 rounded-xl bg-surface p-2">
            <CitationList
              citations={sources}
              onOpenSource={onOpenSource}
              disableAnimation={disableAnimation}
            />
          </View>
        </Disclosure>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 12,
    marginLeft: -6,
  },
  action: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  layer: { position: "absolute" },
  sources: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
    minHeight: 30,
  },
  tabular: { fontVariant: ["tabular-nums"] },
});
