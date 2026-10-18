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

  return (
    <View
      accessibilityState={{ busy: running }}
      className={`w-full ${className}`}
      {...props}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}${meta ? `, ${meta}` : ""}, ${tool}, ${STATUS_LABEL[status]}`}
        onPress={() => setOpen(!open)}
        style={styles.header}
        className="py-1"
      >
        <View style={styles.icon}>{kindIcon}</View>
        {/* Two lines, so a phone-width header never truncates everything at once. */}
        <View style={styles.texts}>
          <RollText
            text={title}
            className="text-sm font-medium text-foreground"
            reduce={reduce}
          />
          <View style={styles.subline}>
            {meta ? (
              <RollText
                text={meta}
                className="text-xs text-muted"
                reduce={reduce}
              />
            ) : null}
            <RollText
              text={tool}
              className="font-mono text-[11px] text-muted/60"
              reduce={reduce}
            />
          </View>
        </View>
        <View accessibilityLiveRegion="polite" style={styles.status}>
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
        <View className="pl-6 pt-1.5">
          <View className="overflow-hidden rounded-xl bg-surface">
            <ScrollView
              ref={scrollRef}
              style={{ maxHeight }}
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
            {onCopy || onRetry ? (
              <View style={styles.bar} className="px-2 pb-1.5">
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
                <View style={styles.barLabel}>
                  <RollText
                    text={STATUS_LABEL[status]}
                    className="text-[11px] text-muted/60"
                    reduce={reduce}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Disclosure>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
  },
  icon: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  subline: { flexDirection: "row", alignItems: "center", gap: 8 },
  status: { flexDirection: "row", alignItems: "center", gap: 4 },
  bar: { flexDirection: "row", alignItems: "center", gap: 2 },
  barLabel: { marginLeft: "auto" },
  small: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
