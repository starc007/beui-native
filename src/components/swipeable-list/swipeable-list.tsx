import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type AccessibilityActionEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { type IconSource, renderIcon } from "../../primitives/render-icon";

export type SwipeSide = "left" | "right";

export type SwipeableListValue = { id: string; side: SwipeSide };

export type SwipeActionTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger";

export type SwipeAction = {
  id: string;
  /** Spoken name, and the accessibility action's label. */
  label: string;
  /** A component given `{ size, color }`, or a prebuilt element. */
  icon: IconSource;
  tone?: SwipeActionTone;
  disabled?: boolean;
  onPress?: (item: SwipeableListItem) => void;
};

export type SwipeableListItem = {
  id: string;
  title?: string;
  description?: string;
  meta?: string;
  leading?: ReactNode;
  /** Replaces the default title, description and meta layout. */
  content?: ReactNode;
  /** Revealed by swiping right. */
  leftActions?: SwipeAction[];
  /** Revealed by swiping left. */
  rightActions?: SwipeAction[];
  disabled?: boolean;
};

export type SwipeableListClassNames = {
  root?: string;
  item?: string;
  rail?: string;
  action?: string;
  surface?: string;
  title?: string;
  description?: string;
  meta?: string;
};

export type SwipeableListProps = Omit<ViewProps, "children"> & {
  items: SwipeableListItem[];
  /** The open row. Omit it and use `defaultValue` for uncontrolled use. */
  value?: SwipeableListValue | null;
  defaultValue?: SwipeableListValue | null;
  onValueChange?: (value: SwipeableListValue | null) => void;
  onAction?: (payload: {
    item: SwipeableListItem;
    action: SwipeAction;
    side: SwipeSide;
  }) => void;
  /** Width of each action in points. Defaults to 56. */
  actionWidth?: number;
  /** Minimum drag in points before a side opens. Defaults to 34. */
  revealThreshold?: number;
  /** Closes the row after an action runs. Defaults to true. */
  closeOnAction?: boolean;
  /** Settles rows without springing, independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
  classNames?: SwipeableListClassNames;
  renderItem?: (item: SwipeableListItem) => ReactNode;
};

// Release spring tuned so short rebounds and full reveals feel equally direct.
const ROW_SETTLE = {
  stiffness: 560,
  damping: 48,
  mass: 0.82,
  overshootClamping: false,
};
const OPEN_DISTANCE_RATIO = 0.46;
const CLOSE_DISTANCE_RATIO = 0.72;
const OPEN_VELOCITY = 720;
const CLOSE_VELOCITY = 320;
const FLING_DISTANCE = 14;
const RELEASE_VELOCITY_LIMIT = 1500;
// Resistance past the last action, like Motion's dragElastic.
const ELASTIC = 0.04;
const ICON = 16;

const TONES: Record<SwipeActionTone, string> = {
  neutral: "text-muted",
  primary: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
};

function ActionButton({
  action,
  width,
  className,
  onPress,
}: {
  action: SwipeAction;
  width: number;
  className: string;
  onPress: () => void;
}) {
  const { color } = useResolveClassNames(TONES[action.tone ?? "neutral"]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      disabled={action.disabled}
      className={`h-full items-center justify-center ${action.disabled ? "opacity-50" : ""} ${className}`}
      style={{ width }}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View
          className={`h-9 w-9 items-center justify-center rounded-full ${pressed ? "bg-background" : ""}`}
          style={pressed ? styles.pressed : undefined}
        >
          {renderIcon(action.icon, { size: ICON, color })}
        </View>
      )}
    </Pressable>
  );
}

function Row({
  item,
  actionWidth,
  revealThreshold,
  openValue,
  setOpenValue,
  closeOnAction,
  onAction,
  reduce,
  classNames,
  renderItem,
}: {
  item: SwipeableListItem;
  actionWidth: number;
  revealThreshold: number;
  openValue: SwipeableListValue | null;
  setOpenValue: (value: SwipeableListValue | null) => void;
  closeOnAction: boolean;
  onAction: SwipeableListProps["onAction"];
  reduce: boolean;
  classNames?: SwipeableListClassNames;
  renderItem?: (item: SwipeableListItem) => ReactNode;
}) {
  const leftActions = item.leftActions ?? [];
  const rightActions = item.rightActions ?? [];
  const leftWidth = leftActions.length * actionWidth;
  const rightWidth = rightActions.length * actionWidth;
  const openSide = openValue?.id === item.id ? openValue.side : null;
  const otherOpen = openValue !== null && openValue.id !== item.id;
  const targetFor = useCallback(
    (side: SwipeSide | null) =>
      side === "left" ? leftWidth : side === "right" ? -rightWidth : 0,
    [leftWidth, rightWidth],
  );

  const x = useSharedValue(targetFor(openSide));
  const start = useSharedValue(0);
  // The position this row last settled toward, so prop echoes don't re-animate it.
  const commanded = useRef(targetFor(openSide));

  const settle = useCallback(
    (target: number, velocity = 0) => {
      "worklet";
      const clamped = Math.max(
        -RELEASE_VELOCITY_LIMIT,
        Math.min(RELEASE_VELOCITY_LIMIT, velocity),
      );
      x.value = reduce
        ? target
        : withSpring(target, { ...ROW_SETTLE, velocity: clamped });
    },
    [reduce, x],
  );

  // Follow outside changes, such as another row opening and closing this one.
  useEffect(() => {
    const target = targetFor(openSide);
    if (commanded.current === target) return;
    commanded.current = target;
    settle(target);
  }, [openSide, settle, targetFor]);

  const commit = useCallback(
    (side: SwipeSide | null) => {
      commanded.current = targetFor(side);
      setOpenValue(side ? { id: item.id, side } : null);
    },
    [item.id, setOpenValue, targetFor],
  );

  const closeOthers = useCallback(() => setOpenValue(null), [setOpenValue]);

  const runAction = useCallback(
    (action: SwipeAction, side: SwipeSide) => {
      if (action.disabled) return;
      action.onPress?.(item);
      onAction?.({ item, action, side });
      if (closeOnAction) {
        commit(null);
        settle(0);
      }
    },
    [closeOnAction, commit, item, onAction, settle],
  );

  const pan = Gesture.Pan()
    .enabled(!item.disabled)
    // Horizontal intent claims the row; vertical intent leaves the scroll alone.
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onStart(() => {
      cancelAnimation(x);
      start.value = x.value;
      if (otherOpen) scheduleOnRN(closeOthers);
    })
    .onUpdate((event) => {
      const raw = start.value + event.translationX;
      x.value =
        raw > leftWidth
          ? leftWidth + (raw - leftWidth) * ELASTIC
          : raw < -rightWidth
            ? -rightWidth + (raw + rightWidth) * ELASTIC
            : raw;
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const latest = x.value;
      let side: SwipeSide | null = null;

      if (openSide === "left") {
        side =
          latest < leftWidth * CLOSE_DISTANCE_RATIO ||
          velocity < -CLOSE_VELOCITY
            ? null
            : "left";
      } else if (openSide === "right") {
        side =
          Math.abs(latest) < rightWidth * CLOSE_DISTANCE_RATIO ||
          velocity > CLOSE_VELOCITY
            ? null
            : "right";
      } else if (
        leftWidth > 0 &&
        latest > 0 &&
        (latest > Math.max(revealThreshold, leftWidth * OPEN_DISTANCE_RATIO) ||
          (velocity > OPEN_VELOCITY && latest > FLING_DISTANCE))
      ) {
        side = "left";
      } else if (
        rightWidth > 0 &&
        latest < 0 &&
        (latest <
          -Math.max(revealThreshold, rightWidth * OPEN_DISTANCE_RATIO) ||
          (velocity < -OPEN_VELOCITY && latest < -FLING_DISTANCE))
      ) {
        side = "right";
      }

      settle(
        side === "left" ? leftWidth : side === "right" ? -rightWidth : 0,
        velocity,
      );
      scheduleOnRN(commit, side);
    });

  // A tap on an open row closes it, as in native mail and message lists.
  const tap = Gesture.Tap()
    .enabled(openSide !== null)
    .onEnd(() => {
      settle(0);
      scheduleOnRN(commit, null);
    });

  const surfaceStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const accessibilityActions = useMemo(
    () =>
      [...leftActions, ...rightActions]
        .filter((action) => !action.disabled)
        .map((action) => ({ name: action.id, label: action.label })),
    [leftActions, rightActions],
  );

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    const name = event.nativeEvent.actionName;
    const left = leftActions.find((action) => action.id === name);
    const right = rightActions.find((action) => action.id === name);
    if (left) runAction(left, "left");
    else if (right) runAction(right, "right");
  };

  const content = renderItem ? (
    renderItem(item)
  ) : item.content !== undefined ? (
    item.content
  ) : (
    <View className="flex-row items-center gap-3">
      {item.leading ? <View className="shrink-0">{item.leading}</View> : null}
      <View className="flex-1">
        {item.title ? (
          <Text
            numberOfLines={1}
            className={`text-sm font-medium text-foreground ${classNames?.title ?? ""}`}
          >
            {item.title}
          </Text>
        ) : null}
        {item.description ? (
          <Text
            numberOfLines={1}
            className={`mt-0.5 text-xs text-muted ${classNames?.description ?? ""}`}
          >
            {item.description}
          </Text>
        ) : null}
      </View>
      {item.meta ? (
        <Text
          className={`shrink-0 text-xs font-medium text-muted ${classNames?.meta ?? ""}`}
        >
          {item.meta}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View
      className={`overflow-hidden rounded-2xl bg-muted/10 ${item.disabled ? "opacity-60" : ""} ${classNames?.item ?? ""}`}
    >
      <View
        // Hidden actions stay out of reach; screen readers use the row's actions.
        accessibilityElementsHidden={openSide === null}
        importantForAccessibility={
          openSide === null ? "no-hide-descendants" : "auto"
        }
        className={`absolute inset-0 flex-row ${classNames?.rail ?? ""}`}
      >
        <View className="h-full flex-row">
          {leftActions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              width={actionWidth}
              className={classNames?.action ?? ""}
              onPress={() => runAction(action, "left")}
            />
          ))}
        </View>
        <View className="ms-auto h-full flex-row">
          {rightActions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              width={actionWidth}
              className={classNames?.action ?? ""}
              onPress={() => runAction(action, "right")}
            />
          ))}
        </View>
      </View>

      <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
        <Animated.View
          accessible
          accessibilityLabel={
            [item.title, item.description, item.meta]
              .filter(Boolean)
              .join(", ") || undefined
          }
          accessibilityHint={
            accessibilityActions.length > 0
              ? "Has actions. Use the actions menu to choose one."
              : undefined
          }
          accessibilityActions={accessibilityActions}
          onAccessibilityAction={onAccessibilityAction}
          accessibilityState={{ disabled: item.disabled ?? false }}
          className={`min-h-[72px] justify-center rounded-2xl border border-border bg-surface px-4 py-3 ${classNames?.surface ?? ""}`}
          style={[styles.surface, surfaceStyle]}
        >
          {content}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/** List rows that swipe left or right to reveal action buttons. */
export function SwipeableList({
  items,
  value,
  defaultValue = null,
  onValueChange,
  onAction,
  actionWidth = 56,
  revealThreshold = 34,
  closeOnAction = true,
  disableAnimation = false,
  className = "",
  classNames,
  renderItem,
  ...props
}: SwipeableListProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const openValue = value === undefined ? uncontrolled : value;
  const reducedMotion = useReducedMotionPreference();

  const setOpenValue = useCallback(
    (next: SwipeableListValue | null) => {
      if (value === undefined) setUncontrolled(next);
      onValueChange?.(next);
    },
    [onValueChange, value],
  );

  return (
    <View
      {...props}
      className={`w-full gap-2 ${className} ${classNames?.root ?? ""}`}
    >
      {items.map((item) => (
        <Row
          key={item.id}
          item={item}
          actionWidth={actionWidth}
          revealThreshold={revealThreshold}
          openValue={openValue}
          setOpenValue={setOpenValue}
          closeOnAction={closeOnAction}
          onAction={onAction}
          reduce={reducedMotion || disableAnimation}
          classNames={classNames}
          renderItem={renderItem}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { boxShadow: "0 1px 2px rgba(0, 0, 0, 0.06)" },
  pressed: { transform: [{ scale: 0.95 }] },
});
