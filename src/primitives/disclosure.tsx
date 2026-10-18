import { type ReactNode, useEffect, useRef } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  measure,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import { EASE_OUT } from "../styles/motion";

const OPEN = { duration: 220, easing: EASE_OUT };
const CLOSE = { duration: 140, easing: EASE_OUT };
const DROP = 4;
// The height while settled open: unconstrained, so growing content just flows.
const NATURAL = -1;

export type DisclosureProps = {
  open: boolean;
  /** Snaps open and closed, keeping only the fade. */
  reduce: boolean;
  /** Caps the open height; content clips beyond it. */
  maxHeight?: number;
  style?: ViewStyle;
  children: ReactNode;
};

/**
 * Collapsible content shared by the agent components: the height eases
 * between closed and the content's size while the content fades and drops 4
 * points into place. Settled open, the height is left alone, so content that
 * grows (streamed rows, new sources) is never clipped. Closed content is
 * hidden from screen readers and touches.
 */
export function Disclosure({
  open,
  reduce,
  maxHeight,
  style,
  children,
}: DisclosureProps) {
  // The content's height, kept current by layout events; measuring on demand
  // can read 0 for content inside a scroll view.
  const contentHeight = useSharedValue(0);
  const clipRef = useAnimatedRef<Animated.View>();
  const height = useSharedValue(open ? NATURAL : 0);
  const shown = useSharedValue(open ? 1 : 0);
  const mounted = useRef(false);

  useEffect(() => {
    // The first render is already in place.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const cap = maxHeight ?? Number.POSITIVE_INFINITY;
    scheduleOnUI(() => {
      "worklet";
      // Real sizes, read on the UI thread at the moment of the change.
      const full = Math.min(contentHeight.value, cap);
      if (open) {
        const from = height.value === NATURAL ? full : height.value;
        if (reduce) {
          height.value = NATURAL;
        } else {
          height.value = from;
          height.value = withTiming(full, OPEN, (done) => {
            if (done) height.value = NATURAL;
          });
        }
      } else {
        const clip = measure(clipRef);
        const from =
          height.value === NATURAL ? (clip?.height ?? full) : height.value;
        height.value = from;
        height.value = reduce ? 0 : withTiming(0, CLOSE);
      }
    });
    shown.value = withTiming(
      open ? 1 : 0,
      reduce ? { duration: 0 } : open ? OPEN : CLOSE,
    );
  }, [clipRef, contentHeight, height, maxHeight, open, reduce, shown]);

  const clipStyle = useAnimatedStyle(() =>
    // Settled open, the clip follows the content's measured height.
    height.value === NATURAL
      ? {
          height: Math.min(
            contentHeight.value,
            maxHeight ?? Number.POSITIVE_INFINITY,
          ),
        }
      : { height: height.value },
  );
  const contentStyle = useAnimatedStyle(
    () => ({
      opacity: shown.value,
      transform: [{ translateY: reduce ? 0 : (1 - shown.value) * -DROP }],
    }),
    [reduce],
  );

  return (
    <Animated.View
      ref={clipRef}
      pointerEvents={open ? "auto" : "none"}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? "auto" : "no-hide-descendants"}
      style={[styles.clip, clipStyle, style]}
    >
      {/* Absolutely placed, so the content keeps its natural height while the
          clip around it is short, and can be measured at any time. */}
      <Animated.View style={[styles.content, contentStyle]}>
        <View
          style={styles.measure}
          onLayout={({ nativeEvent }) => {
            contentHeight.value = nativeEvent.layout.height;
          }}
        >
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  content: { position: "absolute", left: 0, right: 0, top: 0 },
  measure: { flexShrink: 0 },
});
