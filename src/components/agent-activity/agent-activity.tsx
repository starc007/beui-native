import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
  type ViewProps,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { ChevronDownGlyph } from "../../primitives/agent-icons";
import { Disclosure } from "../../primitives/disclosure";
import { FadeEdge } from "../../primitives/fade-edge";
import { RiseIn } from "../../primitives/rise-in";
import { SPRING_LAYOUT, SPRING_SWAP } from "../../styles/motion";
import { ThinkingShimmer } from "../loading-states/thinking-shimmer";
import { ActivityRow, textOf } from "./activity-row";
import type {
  AgentActivityContentType,
  AgentActivityItem,
  AgentActivityStatus,
  AgentSearchResult,
} from "./types";

const EDGE = 12;

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
}

function contentTypeOf(
  items: AgentActivityItem[],
  fallback?: AgentActivityContentType,
) {
  const first = items[0];
  if (!first) return fallback ?? "mixed";
  return items.every((item) => item.type === first.type) ? first.type : "mixed";
}

function activeLabelFor(type: AgentActivityContentType) {
  if (type === "search") return "Searching the web…";
  if (type === "tool") return "Running tools…";
  if (type === "trace") return "Working through the run…";
  if (type === "mixed") return "Working through it…";
  return "Thinking…";
}

function summaryFor(
  type: AgentActivityContentType,
  items: AgentActivityItem[],
  duration: number,
) {
  const n = items.length;
  if (type === "step" || type === "text")
    return `Thought for ${formatDuration(duration)}`;
  if (type === "search") return "Searched the web";
  if (type === "tool") return `Ran ${n} ${n === 1 ? "tool" : "tools"}`;
  if (type === "trace") {
    const messages = items.filter(
      (item) =>
        item.type === "trace" &&
        (item.kind === "thinking" || item.kind === "message"),
    ).length;
    const tools = n - messages;
    return `${tools} ${tools === 1 ? "tool call" : "tool calls"}, ${messages} ${messages === 1 ? "message" : "messages"}`;
  }
  return `Completed ${n} ${n === 1 ? "step" : "steps"}`;
}

export type AgentActivityProps = Omit<ViewProps, "children"> & {
  /** Entries in order. Append or update them as events stream in. */
  items: AgentActivityItem[];
  /** The kind of activity expected before the first item arrives. */
  contentType?: AgentActivityContentType;
  /** Defaults to "working". A working run always stays open. */
  status?: AgentActivityStatus;
  /** Elapsed seconds, for the "Thought for" summary. Defaults to 0. */
  duration?: number;
  /** Controlled open state once the run completes. */
  open?: boolean;
  /** Defaults to false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Folds the log away when the run completes. Defaults to true. */
  collapseOnComplete?: boolean;
  /** Replaces the working label, which is derived from the items. */
  activeLabel?: string;
  /** Replaces the completed summary, which is derived from the items. */
  summary?: ReactNode;
  /** Tallest the log grows before it starts gliding. Defaults to 208. */
  maxHeight?: number;
  /** Called when a search result with a `url` is tapped. */
  onOpenResult?: (result: AgentSearchResult) => void;
  className?: string;
  contentClassName?: string;
  /** Shows rows and folds without motion, independently of the system preference. */
  disableAnimation?: boolean;
};

/**
 * What an agent is doing, as it does it: steps, reasoning, searches, tool
 * calls and traces in one log. While working, the newest entry stays pinned
 * to the bottom as the log glides up; once done, it folds into a summary.
 */
export function AgentActivity({
  items,
  contentType,
  status = "working",
  duration = 0,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  collapseOnComplete = true,
  activeLabel,
  summary,
  maxHeight = 208,
  onOpenResult,
  className = "",
  contentClassName = "",
  disableAnimation = false,
  ...props
}: AgentActivityProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const working = status === "working";
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const expanded = working || open;
  const [contentHeight, setContentHeight] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const previousStatus = useRef(status);
  const offset = useSharedValue(0);
  const turn = useSharedValue(expanded ? 1 : 0);
  const { color: muted } = useResolveClassNames("text-muted");
  const { backgroundColor: page } = useResolveClassNames("bg-background");

  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  // Folds (or stays open) once, as the run completes.
  useEffect(() => {
    const was = previousStatus.current;
    previousStatus.current = status;
    if (was === "working" && status === "complete")
      setOpen(!collapseOnComplete);
  });

  const capped = contentHeight > maxHeight;
  const viewport = Math.min(contentHeight, maxHeight);
  const glide = working ? Math.min(0, viewport - contentHeight) : 0;

  useEffect(() => {
    offset.value = reduce ? glide : withSpring(glide, SPRING_LAYOUT);
  }, [glide, offset, reduce]);
  useEffect(() => {
    turn.value = reduce
      ? expanded
        ? 1
        : 0
      : withSpring(expanded ? 1 : 0, SPRING_SWAP);
  }, [expanded, reduce, turn]);

  const listStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 180}deg` }],
  }));

  const type = contentTypeOf(items, contentType);
  const label = activeLabel ?? activeLabelFor(type);
  const done = summary ?? summaryFor(type, items, duration);

  return (
    <View
      accessibilityState={{ busy: working }}
      className={`w-full ${className}`}
      {...props}
    >
      {working ? (
        <View accessibilityLiveRegion="polite" style={styles.header}>
          <ThinkingShimmer>{label}</ThinkingShimmer>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => {
            const next = !open;
            setOpen(next);
            // Read a reopened log from the start.
            if (next) scrollRef.current?.scrollTo({ y: 0, animated: false });
          }}
          hitSlop={8}
          style={styles.header}
        >
          <View style={styles.summary}>
            {textOf(done, "text-sm font-medium text-muted", 1)}
          </View>
          <Animated.View style={chevronStyle}>
            <ChevronDownGlyph size={14} color={muted} />
          </Animated.View>
        </Pressable>
      )}
      <Disclosure open={expanded} reduce={reduce}>
        {/* Sizes to its content up to maxHeight, so there's no height to go stale. */}
        <View>
          <ScrollView
            ref={scrollRef}
            style={[styles.fixed, { maxHeight }]}
            scrollEnabled={!working && capped}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <Animated.View style={listStyle}>
              <View
                onLayout={({ nativeEvent }) =>
                  setContentHeight(nativeEvent.layout.height)
                }
                className={`gap-0.5 py-2 ${contentClassName}`}
              >
                {items.map((item, index) => (
                  <RiseIn key={item.id} reduce={reduce}>
                    <ActivityRow
                      item={item}
                      reduce={reduce}
                      onOpenResult={onOpenResult}
                      connect={
                        item.type === "step" &&
                        items[index + 1]?.type === "step"
                      }
                    />
                  </RiseIn>
                ))}
              </View>
            </Animated.View>
          </ScrollView>
          {capped ? <FadeEdge color={page} edge="top" height={EDGE} /> : null}
          {capped && !working ? <FadeEdge color={page} height={EDGE} /> : null}
        </View>
      </Disclosure>
    </View>
  );
}

const styles = StyleSheet.create({
  // Scroll views shrink to fit the space above them; inside a closing
  // disclosure that would collapse the log to nothing.
  fixed: { flexGrow: 0, flexShrink: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 28,
    minWidth: 0,
  },
  summary: { flexShrink: 1, minWidth: 0 },
});
