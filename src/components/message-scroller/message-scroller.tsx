import {
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { ArrowUpGlyph } from "../../primitives/agent-icons";
import { SPRING_LAYOUT, SPRING_PRESS } from "../../styles/motion";

export type MessageScrollerHandle = {
  /** Scrolls to the newest message and resumes following. */
  scrollToEnd: (animated?: boolean) => void;
};

export type MessageScrollerProps = Omit<ScrollViewProps, "children"> & {
  /** Keeps the newest message in view as content grows. Defaults to true. */
  followOutput?: boolean;
  /** How close to the end, in points, still counts as following. Defaults to 56. */
  followThreshold?: number;
  /** Animates the follow. Defaults to true. */
  smooth?: boolean;
  onFollowChange?: (following: boolean) => void;
  /** Spoken name of the conversation. Defaults to "Conversation". */
  label?: string;
  /** Marks the conversation busy while a reply streams. */
  busy?: boolean;
  /** Shows a pill back to the newest message after you scroll up. Defaults to true. */
  showJump?: boolean;
  /** Defaults to "Jump to latest". */
  jumpLabel?: string;
  /** Classes for the scroll content. */
  contentClassName?: string;
  className?: string;
  disableAnimation?: boolean;
  children: ReactNode;
  ref?: Ref<MessageScrollerHandle>;
};

/**
 * A conversation that follows new output to the bottom and lets go the moment
 * you drag up to read. A pill brings you back to the latest message.
 */
export function MessageScroller({
  followOutput = true,
  followThreshold = 56,
  smooth = true,
  onFollowChange,
  label = "Conversation",
  busy,
  showJump = true,
  jumpLabel = "Jump to latest",
  contentClassName = "",
  className = "",
  disableAnimation = false,
  children,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
  onContentSizeChange,
  ref,
  ...props
}: MessageScrollerProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const scrollRef = useRef<ScrollView>(null);
  const [following, setFollowingState] = useState(followOutput);
  const followingRef = useRef(followOutput);
  // True from the moment a finger touches until momentum settles.
  const userScrolling = useRef(false);
  const metrics = useRef({ offset: 0, content: 0, viewport: 0 });
  const jump = useSharedValue(0);
  const jumpPress = useSharedValue(1);
  const { color: foreground } = useResolveClassNames("text-foreground");

  const setFollowing = useCallback(
    (next: boolean) => {
      if (followingRef.current === next) return;
      followingRef.current = next;
      setFollowingState(next);
      onFollowChange?.(next);
    },
    [onFollowChange],
  );

  const scrollToEnd = useCallback(
    (animated = smooth && !reduce) => {
      setFollowing(true);
      scrollRef.current?.scrollToEnd({ animated });
    },
    [reduce, setFollowing, smooth],
  );

  useImperativeHandle(ref, () => ({ scrollToEnd }), [scrollToEnd]);

  useEffect(() => {
    if (!followOutput) setFollowing(false);
  }, [followOutput, setFollowing]);

  const overflowing = () =>
    metrics.current.content > metrics.current.viewport + 1;
  const showPill = showJump && !following && overflowing();

  useEffect(() => {
    jump.value = reduce
      ? withTiming(showPill ? 1 : 0, { duration: 120 })
      : withSpring(showPill ? 1 : 0, SPRING_LAYOUT);
  }, [jump, reduce, showPill]);

  const settle = (released: boolean) => {
    const { offset, content, viewport } = metrics.current;
    const near = content - offset - viewport <= followThreshold;
    setFollowing(near);
    // Catch up on anything that arrived while the finger held the list.
    if (near && released)
      scrollRef.current?.scrollToEnd({ animated: smooth && !reduce });
  };

  const jumpStyle = useAnimatedStyle(
    () => ({
      opacity: jump.value,
      transform: [
        { translateY: reduce ? 0 : (1 - jump.value) * 12 },
        { scale: (0.9 + jump.value * 0.1) * jumpPress.value },
      ],
    }),
    [reduce],
  );

  return (
    <View style={styles.root} className={className}>
      <ScrollView
        ref={scrollRef}
        accessibilityLabel={label}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        onLayout={({ nativeEvent }) => {
          metrics.current.viewport = nativeEvent.layout.height;
        }}
        onContentSizeChange={(width, height) => {
          const first = metrics.current.content === 0;
          metrics.current.content = height;
          // Never pull against a finger; letting go decides whether to follow.
          if (followingRef.current && !userScrolling.current) {
            scrollRef.current?.scrollToEnd({
              animated: !first && smooth && !reduce,
            });
          }
          onContentSizeChange?.(width, height);
        }}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const { contentOffset, contentSize, layoutMeasurement } =
            event.nativeEvent;
          metrics.current = {
            offset: contentOffset.y,
            content: contentSize.height,
            viewport: layoutMeasurement.height,
          };
          // Only a finger changes whether we follow; our own scrolls don't.
          if (userScrolling.current) settle(false);
          onScroll?.(event);
        }}
        onScrollBeginDrag={(event) => {
          userScrolling.current = true;
          onScrollBeginDrag?.(event);
        }}
        onScrollEndDrag={(event) => {
          const velocity = event.nativeEvent.velocity?.y ?? 0;
          if (velocity === 0) {
            userScrolling.current = false;
            settle(true);
          }
          onScrollEndDrag?.(event);
        }}
        onMomentumScrollEnd={(event) => {
          if (userScrolling.current) {
            userScrolling.current = false;
            settle(true);
          }
          onMomentumScrollEnd?.(event);
        }}
        {...props}
      >
        <View
          accessibilityLiveRegion="polite"
          accessibilityState={{ busy }}
          className={contentClassName}
        >
          {children}
        </View>
      </ScrollView>
      {showJump ? (
        <Animated.View
          pointerEvents={showPill ? "box-none" : "none"}
          style={[styles.jump, jumpStyle]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={jumpLabel}
            accessibilityElementsHidden={!showPill}
            importantForAccessibility={
              showPill ? "auto" : "no-hide-descendants"
            }
            onPress={() => scrollToEnd()}
            onPressIn={() => {
              if (!reduce) jumpPress.value = withSpring(0.94, SPRING_PRESS);
            }}
            onPressOut={() => {
              jumpPress.value = withSpring(1, SPRING_PRESS);
            }}
            className="h-9 flex-row items-center gap-1.5 rounded-full border border-border bg-background px-3.5"
            style={styles.pill}
          >
            <View style={styles.down}>
              <ArrowUpGlyph size={14} color={foreground} />
            </View>
            <Text className="text-xs font-medium text-foreground">
              {jumpLabel}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  jump: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: "center",
  },
  pill: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  down: { transform: [{ rotate: "180deg" }] },
});
