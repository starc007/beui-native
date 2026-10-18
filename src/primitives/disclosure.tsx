import { type ReactNode, useEffect, useState } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { EASE_OUT } from "../styles/motion";

const OPEN = { duration: 220, easing: EASE_OUT };
const CLOSE = { duration: 140, easing: EASE_OUT };
const DROP = 4;

export type DisclosureProps = {
  open: boolean;
  /** Snaps open and closed, keeping only the fade. */
  reduce: boolean;
  /** Caps the open height; content scrolls or clips beyond it. */
  maxHeight?: number;
  /** The open height, when the caller already knows it. Skips measuring. */
  height?: number;
  style?: ViewStyle;
  children: ReactNode;
};

/**
 * Collapsible content shared by the agent components: the height eases to the
 * content's measured size while the content fades and drops 4 points into
 * place. Closed content is hidden from screen readers and touches.
 */
export function Disclosure({
  open,
  reduce,
  maxHeight,
  height: knownHeight,
  style,
  children,
}: DisclosureProps) {
  const [layoutHeight, setMeasured] = useState(0);
  const measured = knownHeight ?? layoutHeight;
  const target =
    maxHeight === undefined ? measured : Math.min(measured, maxHeight);
  const height = useSharedValue(open ? -1 : 0);
  const shown = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    if (measured === 0 && open) return;
    const timing = open ? OPEN : CLOSE;
    const goal = open ? target : 0;
    if (height.value < 0 || reduce) height.value = goal;
    else height.value = withTiming(goal, timing);
    shown.value = withTiming(open ? 1 : 0, reduce ? { duration: 0 } : timing);
  }, [height, measured, open, reduce, shown, target]);

  const clipStyle = useAnimatedStyle(() =>
    // -1 means "open, not measured yet": lay out naturally for the first frame.
    height.value < 0 ? {} : { height: height.value },
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
      pointerEvents={open ? "auto" : "none"}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? "auto" : "no-hide-descendants"}
      style={[styles.clip, clipStyle, style]}
    >
      <Animated.View style={contentStyle}>
        <View
          style={styles.measure}
          onLayout={({ nativeEvent }) => setMeasured(nativeEvent.layout.height)}
        >
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  measure: { flexShrink: 0 },
});
