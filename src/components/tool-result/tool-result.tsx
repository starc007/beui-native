import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
import {
  BanGlyph,
  BracesGlyph,
  CheckGlyph,
  ChevronDownGlyph,
  CircleCheckGlyph,
  CircleCrossGlyph,
  CopyGlyph,
  RetryGlyph,
  TerminalGlyph,
  WrenchGlyph,
} from "../../primitives/agent-icons";
import { Disclosure } from "../../primitives/disclosure";
import { RollText } from "../../primitives/roll-text";
import { RunningBar } from "../../primitives/running-bar";
import { SpinGlyph } from "../../primitives/spin-glyph";
import { SPRING_PRESS, SPRING_SWAP } from "../../styles/motion";

export type ToolResultStatus = "running" | "success" | "error" | "cancelled";
export type ToolResultKind = "terminal" | "request" | "custom";

const STATUS_LABEL: Record<ToolResultStatus, string> = {
  running: "Running",
  success: "Completed",
  error: "Failed",
  cancelled: "Cancelled",
};
const STATUS_TEXT: Record<ToolResultStatus, string> = {
  running: "text-primary",
  success: "text-success",
  error: "text-destructive",
  cancelled: "text-muted",
};
const COPIED_FOR = 1600;

export type ToolResultOutputProps = { children: string; className?: string };

/** Tool output, such as terminal lines or a response body, in monospace. */
export function ToolResultOutput({
  children,
  className = "",
}: ToolResultOutputProps) {
  return (
    <Text
      className={`font-mono text-xs leading-5 text-foreground/80 ${className}`}
    >
      {children}
    </Text>
  );
}

function SmallAction({
  label,
  reduce,
  onPress,
  children,
}: {
  label: string;
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
      hitSlop={8}
      onPress={onPress}
      onPressIn={() => {
        if (!reduce) scale.value = withSpring(0.9, SPRING_PRESS);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_PRESS);
      }}
    >
      <Animated.View style={[styles.small, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export type ToolResultProps = Omit<ViewProps, "children"> & {
  /** The tool's name, such as `terminal.run`. */
  tool: string;
  title: string;
  /** The output. Strings render in monospace. */
  children: ReactNode;
  /** Defaults to "running". */
  status?: ToolResultStatus;
  /** Picks the icon. Defaults to "custom". */
  kind?: ToolResultKind;
  /** A short note beside the title, such as a duration or status code. */
  meta?: string;
  /** Replaces the kind's icon. */
  icon?: ReactNode;
  open?: boolean;
  /** Defaults to true. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Folds the output away when the run finishes. Defaults to true. */
  collapseOnComplete?: boolean;
  /** Tallest the output grows before it scrolls. Defaults to 220. */
  maxHeight?: number;
  /** Shows a copy button. Copy with your clipboard library here. */
  onCopy?: () => unknown;
  /** Shows a run again button. */
  onRetry?: () => void;
  className?: string;
  contentClassName?: string;
  disableAnimation?: boolean;
};

/**
 * A tool call's output that streams in while it runs, following the newest
 * line until you drag up to read, then folds into a one-line result. Title, note and status roll as
 * they change.
 */
export function ToolResult({
  tool,
  title,
  children,
  status = "running",
  kind = "custom",
  meta,
  icon,
  open: controlledOpen,
  defaultOpen = true,
  onOpenChange,
  collapseOnComplete = true,
  maxHeight = 220,
  onCopy,
  onRetry,
  className = "",
  contentClassName = "",
  disableAnimation = false,
  ...props
}: ToolResultProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const running = status === "running";
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const previous = useRef(status);
  const scrollRef = useRef<ScrollView>(null);
  // Follows new output until you drag up to read; reaching the end again resumes.
  const following = useRef(true);
  const dragging = useRef(false);
  const turn = useSharedValue(open ? 1 : 0);
  const { color: muted } = useResolveClassNames("text-muted");
  const { color: tone } = useResolveClassNames(STATUS_TEXT[status]);
  const { color: foreground } = useResolveClassNames("text-foreground");

  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    const was = previous.current;
    previous.current = status;
    if (was !== "running" && status === "running") {
      following.current = true;
      setOpen(true);
    } else if (was === "running" && status !== "running" && collapseOnComplete)
      setOpen(false);
  });

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  useEffect(() => {
    turn.value = reduce
      ? open
        ? 1
        : 0
      : withSpring(open ? 1 : 0, SPRING_SWAP);
  }, [open, reduce, turn]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 180}deg` }],
  }));

  const copy = async () => {
    await onCopy?.();
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_FOR);
  };

  // Times the run when no note is given: ticks while running, then holds.
  const [elapsed, setElapsed] = useState<number | null>(null);
  const startedAt = useRef<number | null>(running ? Date.now() : null);
  useEffect(() => {
    if (!running) return;
    if (startedAt.current === null) startedAt.current = Date.now();
    const start = startedAt.current;
    setElapsed(Date.now() - start);
    const timer = setInterval(() => setElapsed(Date.now() - start), 100);
    return () => {
      clearInterval(timer);
      setElapsed(Date.now() - start);
      startedAt.current = null;
    };
  }, [running]);

  const kindIcon =
    icon ??
    (kind === "terminal" ? (
      <TerminalGlyph size={16} color={muted} />
    ) : kind === "request" ? (
      <BracesGlyph size={16} color={muted} />
    ) : (
      <WrenchGlyph size={16} color={muted} />
    ));
  const statusIcon = running ? (
    <SpinGlyph size={12} color={tone} reduce={reduce} />
  ) : status === "success" ? (
    <CircleCheckGlyph size={12} color={tone} />
  ) : status === "error" ? (
    <CircleCrossGlyph size={12} color={tone} />
  ) : (
    <BanGlyph size={12} color={tone} />
  );

  const lineCount =
    typeof children === "string" && children.trim()
      ? children.trimEnd().split("\n").length
      : 0;
  const shownMeta =
    meta ?? (elapsed === null ? undefined : formatElapsed(elapsed));
  const failed = status === "error";

  return (
    <View
      accessibilityState={{ busy: running }}
      className={`w-full overflow-hidden rounded-2xl border border-border bg-surface/50 ${className}`}
      {...props}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}${shownMeta ? `, ${shownMeta}` : ""}, ${tool}, ${STATUS_LABEL[status]}`}
        onPress={() => setOpen(!open)}
        style={styles.header}
        className="px-3.5 py-3"
      >
        <View
          style={styles.tile}
          className="rounded-lg border border-border bg-background"
        >
          {kindIcon}
        </View>
        {/* Two lines, so a phone-width header never truncates everything at once. */}
        <View style={styles.texts}>
          <RollText
            text={title}
            className="text-sm font-semibold text-foreground"
            reduce={reduce}
          />
          <View style={styles.subline}>
            <Text
              numberOfLines={1}
              className="shrink font-mono text-[11px] text-muted"
            >
              {tool}
            </Text>
            {shownMeta ? (
              <>
                <Text className="text-[11px] text-muted/60">·</Text>
                {/* A live timer ticks as plain text; a given note rolls. */}
                {meta ? (
                  <RollText
                    text={meta}
                    className="text-[11px] text-muted"
                    reduce={reduce}
                  />
                ) : (
                  <Text
                    className="text-[11px] text-muted"
                    style={styles.tabular}
                  >
                    {shownMeta}
                  </Text>
                )}
              </>
            ) : null}
          </View>
        </View>
        <View
          accessibilityLiveRegion="polite"
          style={styles.status}
          className={`rounded-full px-2 py-1 ${STATUS_PILL[status]}`}
        >
          {statusIcon}
          <RollText
            text={STATUS_LABEL[status]}
            className={`text-[11px] font-medium ${STATUS_TEXT[status]}`}
            reduce={reduce}
          />
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDownGlyph size={14} color={muted} />
        </Animated.View>
      </Pressable>
      <Disclosure open={open} reduce={reduce}>
        <View
          className={`mx-3 mb-3 overflow-hidden rounded-xl border ${failed ? "border-destructive/20 bg-destructive/5" : "border-border bg-background"}`}
        >
          <ScrollView
            ref={scrollRef}
            style={[styles.fixed, { maxHeight }]}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={32}
            onScrollBeginDrag={() => {
              dragging.current = true;
            }}
            onMomentumScrollEnd={() => {
              dragging.current = false;
            }}
            onScrollEndDrag={({ nativeEvent }) => {
              if (!nativeEvent.velocity?.y) dragging.current = false;
            }}
            onScroll={({ nativeEvent }) => {
              if (!dragging.current) return;
              const { contentOffset, contentSize, layoutMeasurement } =
                nativeEvent;
              following.current =
                contentSize.height -
                  contentOffset.y -
                  layoutMeasurement.height <
                24;
            }}
            onContentSizeChange={() => {
              if (running && following.current && !dragging.current) {
                scrollRef.current?.scrollToEnd({ animated: !reduce });
              }
            }}
          >
            <View
              accessibilityLiveRegion="polite"
              className={`p-3 ${contentClassName}`}
            >
              {typeof children === "string" ? (
                <ToolResultOutput>{children}</ToolResultOutput>
              ) : (
                children
              )}
            </View>
          </ScrollView>
          {onCopy || onRetry || lineCount > 0 ? (
            <View
              style={styles.bar}
              className="border-t border-border px-1.5 py-1"
            >
              {onCopy ? (
                <SmallAction
                  label={copied ? "Copied" : "Copy result"}
                  reduce={reduce}
                  onPress={() => void copy()}
                >
                  {copied ? (
                    <CheckGlyph size={14} color={foreground} />
                  ) : (
                    <CopyGlyph size={14} color={muted} />
                  )}
                </SmallAction>
              ) : null}
              {onRetry ? (
                <SmallAction
                  label="Run again"
                  reduce={reduce}
                  onPress={onRetry}
                >
                  <RetryGlyph size={14} color={muted} />
                </SmallAction>
              ) : null}
              {lineCount > 0 ? (
                <Text
                  className="ml-auto pr-1.5 text-[11px] text-muted/70"
                  style={styles.tabular}
                >
                  {lineCount} {lineCount === 1 ? "line" : "lines"}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </Disclosure>
      {running ? <RunningBar reduce={reduce} /> : null}
    </View>
  );
}

function formatElapsed(ms: number) {
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds - minutes * 60)}s`;
}

// Full class strings, so Uniwind can see every token at build time.
const STATUS_PILL: Record<ToolResultStatus, string> = {
  running: "bg-primary/10",
  success: "bg-success/10",
  error: "bg-destructive/10",
  cancelled: "bg-foreground/5",
};

const styles = StyleSheet.create({
  // Scroll views shrink to fit the space above them; inside a closing
  // disclosure that would collapse the content to nothing.
  fixed: { flexGrow: 0, flexShrink: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 56,
  },
  tile: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  subline: { flexDirection: "row", alignItems: "center", gap: 6 },
  status: { flexDirection: "row", alignItems: "center", gap: 4 },
  bar: { flexDirection: "row", alignItems: "center", gap: 2 },
  tabular: { fontVariant: ["tabular-nums"] },
  small: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
