import {
  Children,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Overlay } from "../../primitives/overlay";
import { EASE_OUT } from "../../styles/motion";
import { usePickerContext } from "./context";
import { Checkerboard } from "./surfaces";

// Opening springs the panel out of the trigger's corner, quick and lightly
// damped, like a native popover. Closing runs the same path back as a short
// timed fade, so it has a fixed end: the modal is gone the moment it's done,
// and the next tap lands on the page instead of an invisible overlay.
const OPEN = { stiffness: 380, damping: 30, mass: 0.8 };
const CLOSE = { duration: 160, easing: EASE_OUT };
const REDUCED = { duration: 150 };
const PANEL_WIDTH = 288;
const GUTTER = 8;
const GAP = 8;
const EDGE = 16;
const CHIP = 24;
const CHIP_RADIUS = 6;
const KEYBOARD_SHIFT = { duration: 220, easing: EASE_OUT };

/** The on-screen keyboard's height while `active`, or 0. */
function useKeyboardHeight(active: boolean) {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!active) return;
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(
      ios ? "keyboardWillShow" : "keyboardDidShow",
      (event) => setHeight(event.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      ios ? "keyboardWillHide" : "keyboardDidHide",
      () => setHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [active]);
  return height;
}

export type ColorPickerTriggerProps = Omit<
  PressableProps,
  "children" | "style"
> & {
  /** Replaces the hex label beside the chip. */
  children?: ReactNode;
  className?: string;
};

/** A color chip and the hex. Opens ColorPickerContent. */
export function ColorPickerTrigger({
  children,
  className = "",
  onPress,
  accessibilityLabel,
  ...props
}: ColorPickerTriggerProps) {
  const { hex, open, setOpen, disabled, triggerRef } =
    usePickerContext("ColorPickerTrigger");
  const alpha = hex.slice(7);

  return (
    <Pressable
      {...props}
      ref={triggerRef}
      collapsable={false}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `Color, ${hex.toUpperCase()}`}
      accessibilityHint={open ? undefined : "Opens the color picker"}
      aria-expanded={open}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={(event) => {
        onPress?.(event);
        if (!event.defaultPrevented) setOpen(!open);
      }}
      className={`h-11 flex-row items-center gap-2.5 self-start rounded-xl border border-border bg-background pr-3.5 pl-2.5 active:opacity-80 ${className}`}
    >
      <View style={styles.chip}>
        <Checkerboard width={CHIP} height={CHIP} />
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.edge,
            { backgroundColor: hex },
          ]}
        />
      </View>
      {children ?? (
        <Text className="font-mono text-sm uppercase text-foreground tabular-nums">
          {hex.slice(0, 7)}
          {alpha ? <Text className="text-muted">{alpha}</Text> : null}
        </Text>
      )}
    </Pressable>
  );
}

/** One row of the panel, settling in just behind the one above it. */
function Row({
  index,
  progress,
  children,
}: {
  index: number;
  progress: SharedValue<number>;
  children: ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const start = index * 0.07;
    const q = interpolate(
      progress.value,
      [start, start + 0.6],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: q, transform: [{ translateY: -4 * (1 - q) }] };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

export type ColorPickerContentProps = {
  children: ReactNode;
  /** Names the panel for screen readers. Defaults to "Color picker". */
  accessibilityLabel?: string;
  className?: string;
};

/**
 * The panel ColorPickerTrigger opens. It floats beside the trigger: below it,
 * unless there's more room above. It springs out of the trigger's corner with
 * its rows settling in behind, and folds back the same way, quicker. A tap
 * outside, or Android's back button, closes it.
 */
export function ColorPickerContent({
  children,
  accessibilityLabel = "Color picker",
  className = "",
}: ColorPickerContentProps) {
  const { open, setOpen, progress, reduce, triggerFrame } =
    usePickerContext("ColorPickerContent");
  const window = useWindowDimensions();
  const keyboard = useKeyboardHeight(open);
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);
  // A modal takes a moment to appear. Waiting for it, and for the panel's
  // first layout, means the opening plays where it can be seen.
  const [shown, setShown] = useState(false);
  if (!present && shown) setShown(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const shift = useSharedValue(0);

  const hide = useCallback(() => setPresent(false), []);

  // onShow doesn't fire everywhere, such as on web; don't wait on it forever.
  useEffect(() => {
    if (!present || shown) return;
    const timer = setTimeout(() => setShown(true), 300);
    return () => clearTimeout(timer);
  }, [present, shown]);

  const ready = shown && panelHeight > 0;

  useEffect(() => {
    if (!present) return;
    if (open && !ready) return;
    cancelAnimation(progress);
    if (open) {
      progress.value = reduce ? withTiming(1, REDUCED) : withSpring(1, OPEN);
      return;
    }
    Keyboard.dismiss();
    progress.value = withTiming(0, reduce ? REDUCED : CLOSE, (finished) => {
      if (finished) scheduleOnRN(hide);
    });
  }, [hide, open, present, progress, ready, reduce]);

  // Side and position, from the trigger's frame.
  const width = Math.min(PANEL_WIDTH, window.width - GUTTER * 2);
  const trigger = triggerFrame ?? { x: GUTTER, y: 120, width: 0, height: 44 };
  const left = Math.min(
    Math.max(trigger.x, GUTTER),
    window.width - width - GUTTER,
  );
  const below = window.height - (trigger.y + trigger.height) - GAP - EDGE;
  const above = trigger.y - GAP - EDGE;
  const isTop = panelHeight > 0 && below < panelHeight && above > below;
  const top = isTop
    ? trigger.y - GAP - panelHeight
    : trigger.y + trigger.height + GAP;

  // When typing in a field, lift the panel clear of the keyboard.
  useEffect(() => {
    const limit = window.height - keyboard - GUTTER;
    const overflow = keyboard > 0 ? Math.max(0, top + panelHeight - limit) : 0;
    shift.value = withTiming(-overflow, KEYBOARD_SHIFT);
  }, [keyboard, panelHeight, shift, top, window.height]);

  // The panel grows from the corner nearest the trigger's chip.
  const panelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const settled = Math.min(1, Math.max(0, p));
    return {
      opacity: interpolate(p, [0, 0.5], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: shift.value + (isTop ? 8 : -8) * (1 - settled) },
        { scale: reduce ? 1 : 0.9 + 0.1 * p },
      ],
    };
  });

  let row = 0;
  const rows = Children.map(children, (child) => {
    const index = row;
    row += 1;
    return (
      <Row index={index} progress={progress}>
        {child}
      </Row>
    );
  });

  return (
    <Overlay
      visible={present}
      onShow={() => setShown(true)}
      onRequestClose={() => setOpen(false)}
    >
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        style={StyleSheet.absoluteFill}
        onPress={() => setOpen(false)}
      />
      <Animated.View
        accessibilityViewIsModal
        accessibilityLabel={accessibilityLabel}
        onLayout={({ nativeEvent }) =>
          setPanelHeight(nativeEvent.layout.height)
        }
        className={`gap-3 rounded-2xl border border-border bg-background p-3 ${className}`}
        style={[
          styles.panel,
          { left, top, width },
          isTop ? styles.fromBottom : styles.fromTop,
          panelStyle,
        ]}
      >
        {rows}
      </Animated.View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    boxShadow: "0 12px 32px -8px rgba(0, 0, 0, 0.25)",
  },
  // The corner nearest the trigger's chip, at the panel's left edge.
  fromTop: { transformOrigin: "24px 0px" },
  fromBottom: { transformOrigin: "24px 100%" },
  chip: {
    width: CHIP,
    height: CHIP,
    borderRadius: CHIP_RADIUS,
    overflow: "hidden",
  },
  edge: {
    borderRadius: CHIP_RADIUS,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
});
