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
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { useResolveClassNames } from "uniwind";
import { usePresence } from "../../hooks/use-presence";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { ChevronDownGlyph, ListGlyph } from "../../primitives/agent-icons";
import { Disclosure } from "../../primitives/disclosure";
import { RiseIn } from "../../primitives/rise-in";
import { RollText } from "../../primitives/roll-text";
import { EASE_OUT, SPRING_LAYOUT, SPRING_SWAP } from "../../styles/motion";

export type TodoItemStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "cancelled";

export type TodoItem = {
  id: string;
  title: string;
  /** Defaults to "pending". */
  status?: TodoItemStatus;
  /** 0–100 while in progress. Omit it for an indeterminate spinner. */
  progress?: number;
  detail?: ReactNode;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const RING = 2 * Math.PI * 9;
const CHECK = "M7.5 12.25 10.5 15.25 16.75 8.75";
const CHECK_LENGTH = Math.hypot(3, 3) + Math.hypot(6.25, 6.5);
const CROSS = "M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5";
const CROSS_LENGTH = Math.hypot(7, 7) * 2;
const DRAW_CHECK = { duration: 240, easing: EASE_OUT };
const DRAW_CROSS = { duration: 200, easing: EASE_OUT };
const FILL = { duration: 180, easing: EASE_OUT };
const INDETERMINATE = 0.68;

const STATUS_LABEL: Record<TodoItemStatus, string> = {
  pending: "Pending",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
const TITLE_CLASS: Record<TodoItemStatus, string> = {
  pending: "text-muted/70",
  "in-progress": "text-foreground",
  completed: "text-muted/60",
  cancelled: "text-muted/60",
};

/**
 * A ring that morphs with the status: dashed while pending, a progress arc
 * while in progress (spinning when the progress is unknown), a drawn check
 * when completed and a cross when cancelled.
 */
function StatusMark({
  status,
  progress,
  reduce,
}: {
  status: TodoItemStatus;
  progress?: number;
  reduce: boolean;
}) {
  const { color: muted } = useResolveClassNames("text-muted");
  const { color: foreground } = useResolveClassNames("text-foreground");
  const { color: destructive } = useResolveClassNames("text-destructive");
  const color =
    status === "in-progress"
      ? foreground
      : status === "cancelled"
        ? destructive
        : muted;
  const active = status === "in-progress";
  const indeterminate = active && progress === undefined;
  const target =
    progress === undefined
      ? INDETERMINATE
      : Math.min(100, Math.max(0, progress)) / 100;

  const arc = useSharedValue(active ? target : 0);
  const fill = useSharedValue(status === "completed" ? 0.06 : 0);
  const check = useSharedValue(status === "completed" ? 1 : 0);
  const cross = useSharedValue(status === "cancelled" ? 1 : 0);
  const spin = useSharedValue(0);

  useEffect(() => {
    const instant = (value: number) => value;
    arc.value = reduce
      ? instant(active ? target : 0)
      : withSpring(active ? target : 0, SPRING_LAYOUT);
    fill.value = reduce
      ? instant(status === "completed" ? 0.06 : 0)
      : withTiming(status === "completed" ? 0.06 : 0, FILL);
    check.value = reduce
      ? instant(status === "completed" ? 1 : 0)
      : withTiming(status === "completed" ? 1 : 0, DRAW_CHECK);
    cross.value = reduce
      ? instant(status === "cancelled" ? 1 : 0)
      : withTiming(status === "cancelled" ? 1 : 0, DRAW_CROSS);
  }, [active, arc, check, cross, fill, reduce, status, target]);

  useEffect(() => {
    if (!indeterminate || reduce) {
      cancelAnimation(spin);
      spin.value = 0;
      return;
    }
    spin.value = withRepeat(
      withTiming(1, {
        duration: 1100,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      }),
      -1,
      false,
    );
    return () => cancelAnimation(spin);
  }, [indeterminate, reduce, spin]);

  const baseProps = useAnimatedProps(() => ({ fillOpacity: fill.value }));
  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: RING * (1 - arc.value),
    strokeOpacity: arc.value > 0.001 ? 1 : 0,
  }));
  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - check.value),
    strokeOpacity: check.value > 0.001 ? 1 : 0,
  }));
  const crossProps = useAnimatedProps(() => ({
    strokeDashoffset: CROSS_LENGTH * (1 - cross.value),
    strokeOpacity: cross.value > 0.001 ? 1 : 0,
  }));
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-90 + spin.value * 360}deg` }],
  }));

  return (
    <View style={styles.mark}>
      <Svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        style={StyleSheet.absoluteFill}
      >
        <AnimatedCircle
          cx={12}
          cy={12}
          r={9}
          fill={color}
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray={status === "pending" ? "2 3" : undefined}
          strokeOpacity={active ? 0.2 : 1}
          animatedProps={baseProps}
        />
        <AnimatedPath
          d={CHECK}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${CHECK_LENGTH} ${CHECK_LENGTH}`}
          animatedProps={checkProps}
        />
        <AnimatedPath
          d={CROSS}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={`${CROSS_LENGTH} ${CROSS_LENGTH}`}
          animatedProps={crossProps}
        />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, spinStyle]}>
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <AnimatedCircle
            cx={12}
            cy={12}
            r={9}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={`${RING} ${RING}`}
            animatedProps={arcProps}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** A line drawn through a finished task's title, left to right. */
function Strike({
  on,
  reduce,
  color,
}: {
  on: boolean;
  reduce: boolean;
  color: unknown;
}) {
  const drawn = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    drawn.value = reduce
      ? on
        ? 1
        : 0
      : withDelay(
          on ? 60 : 0,
          withTiming(on ? 1 : 0, { duration: 280, easing: EASE_OUT }),
        );
  }, [drawn, on, reduce]);
  const style = useAnimatedStyle(() => ({
    opacity: drawn.value,
    transform: [{ scaleX: drawn.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.strike, { backgroundColor: color as string }, style]}
    />
  );
}

function HeaderIcon({ done, reduce }: { done: boolean; reduce: boolean }) {
  const { color: muted } = useResolveClassNames("text-muted");
  const { color: success } = useResolveClassNames("text-success");
  const items = usePresence(done ? "done" : "list", done, () =>
    reduce ? 0 : 260,
  );
  return (
    <View style={styles.headerIcon}>
      {items.map((item) => (
        <HeaderIconLayer
          key={item.key}
          appear={item.appear}
          exiting={item.exiting}
          reduce={reduce}
        >
          {item.value ? (
            <DoneBadge color={success} reduce={reduce} />
          ) : (
            <ListGlyph size={16} color={muted} />
          )}
        </HeaderIconLayer>
      ))}
    </View>
  );
}

function HeaderIconLayer({
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
    transform: [{ scale: 0.72 + shown.value * 0.28 }],
  }));
  return (
    <Animated.View style={[styles.layer, style]}>{children}</Animated.View>
  );
}

function DoneBadge({ color, reduce }: { color: unknown; reduce: boolean }) {
  const drawn = useSharedValue(reduce ? 1 : 0);
  // Draws once, as the list completes.
  useEffect(() => {
    if (!reduce) drawn.value = withTiming(1, DRAW_CHECK);
  }, []);
  const props = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - drawn.value),
  }));
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} fill={color as string} />
      <AnimatedPath
        d={CHECK}
        fill="none"
        stroke="#fff"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${CHECK_LENGTH} ${CHECK_LENGTH}`}
        animatedProps={props}
      />
    </Svg>
  );
}

function TodoRow({ item, reduce }: { item: TodoItem; reduce: boolean }) {
  const status = item.status ?? "pending";
  const { color: strike } = useResolveClassNames(TITLE_CLASS[status]);
  return (
    <View
      accessible
      accessibilityLabel={`${STATUS_LABEL[status]}: ${item.title}`}
      style={styles.row}
      className="rounded-xl px-1.5 py-1"
    >
      <StatusMark status={status} progress={item.progress} reduce={reduce} />
      <View style={styles.title}>
        <View style={styles.titleInner}>
          <Text
            numberOfLines={1}
            className={`text-sm leading-5 ${TITLE_CLASS[status]}`}
          >
            {item.title}
          </Text>
          <Strike on={status === "completed"} reduce={reduce} color={strike} />
        </View>
      </View>
      {item.detail !== undefined ? (
        typeof item.detail === "string" ? (
          <Text className="text-sm text-muted/60" style={styles.tabular}>
            {item.detail}
          </Text>
        ) : (
          item.detail
        )
      ) : null}
    </View>
  );
}

export type TodoListProps = Omit<ViewProps, "children"> & {
  items: TodoItem[];
  /** Defaults to "To-dos". */
  title?: string;
  open?: boolean;
  /** Defaults to true. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Folds the list away once every task is completed. Defaults to true. */
  collapseOnComplete?: boolean;
  /** Tallest the list grows before it scrolls. Defaults to 248. */
  maxHeight?: number;
  className?: string;
  /** Morphs marks and folds without motion, independently of the system preference. */
  disableAnimation?: boolean;
};

/**
 * An agent's plan as a checklist. Each mark morphs with its task's status,
 * finished titles are struck through, the count rolls as tasks complete, and
 * the whole list folds away when it's done.
 */
export function TodoList({
  items,
  title = "To-dos",
  open: controlledOpen,
  defaultOpen = true,
  onOpenChange,
  collapseOnComplete = true,
  maxHeight = 248,
  className = "",
  disableAnimation = false,
  ...props
}: TodoListProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const completed = items.filter((item) => item.status === "completed").length;
  const allComplete = items.length > 0 && completed === items.length;
  const previous = useRef(allComplete);
  const scrollRef = useRef<ScrollView>(null);
  const turn = useSharedValue(open ? 1 : 0);
  const { color: muted } = useResolveClassNames("text-muted");

  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    const was = previous.current;
    previous.current = allComplete;
    if (was && !allComplete) setOpen(true);
    else if (!was && allComplete && collapseOnComplete) setOpen(false);
  });

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

  return (
    <View
      accessibilityLabel="Agent task list"
      className={`w-full overflow-hidden rounded-2xl border border-border ${className}`}
      {...props}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}, ${completed} of ${items.length} tasks completed`}
        onPress={() => setOpen(!open)}
        style={styles.header}
        className="px-3.5"
      >
        <HeaderIcon done={allComplete} reduce={reduce} />
        <Text
          numberOfLines={1}
          className="flex-1 text-sm font-medium text-foreground"
        >
          {title}
        </Text>
        <View style={styles.count}>
          <RollText
            text={String(completed)}
            className={`text-xs font-medium ${allComplete ? "text-success" : "text-muted"}`}
            reduce={reduce}
          />
          <Text
            className={`text-xs font-medium ${allComplete ? "text-success" : "text-muted"}`}
            style={styles.tabular}
          >
            /{items.length}
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDownGlyph size={14} color={muted} />
        </Animated.View>
      </Pressable>
      <Disclosure open={open} reduce={reduce}>
        <ScrollView
          ref={scrollRef}
          style={[styles.fixed, { maxHeight }]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerClassName="px-2 pb-2"
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: !reduce })
          }
        >
          <View accessibilityLiveRegion="polite">
            {items.length === 0 ? (
              <Text className="px-1.5 py-2 text-sm text-muted">
                No tasks yet
              </Text>
            ) : (
              items.map((item) => (
                <RiseIn key={item.id} reduce={reduce}>
                  <TodoRow item={item} reduce={reduce} />
                </RiseIn>
              ))
            )}
          </View>
        </ScrollView>
      </Disclosure>
    </View>
  );
}

const styles = StyleSheet.create({
  // Scroll views shrink to fit the space above them; inside a closing
  // disclosure that would collapse the content to nothing.
  fixed: { flexGrow: 0, flexShrink: 0 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, height: 44 },
  headerIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  layer: { position: "absolute" },
  count: { flexDirection: "row", alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 36 },
  mark: { width: 20, height: 20, marginHorizontal: 2 },
  title: { flex: 1, minWidth: 0 },
  titleInner: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    justifyContent: "center",
  },
  strike: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: StyleSheet.hairlineWidth * 2,
    transformOrigin: ["0%", "50%", 0],
  },
  tabular: { fontVariant: ["tabular-nums"] },
});
