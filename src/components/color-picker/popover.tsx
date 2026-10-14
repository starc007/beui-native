import {
  Children,
  isValidElement,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
import { EASE_OUT } from "../../styles/motion";
import { type Frame, MORPH, PanelContext, usePickerContext } from "./context";
import { Checkerboard, ColorPickerArea } from "./surfaces";

const PANEL_WIDTH = 288;
const GUTTER = 8;
const GAP = 8;
const EDGE = 16;
const CHIP = 24;
const CHIP_RADIUS = 6;
const AREA_RADIUS = 12;
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

/** Opens ColorPickerContent. Its color chip is what grows into the area. */
export function ColorPickerTrigger({
  children,
  className = "",
  onPress,
  accessibilityLabel,
  ...props
}: ColorPickerTriggerProps) {
  const { hex, open, setOpen, disabled, chipRef, triggerRef, progress } =
    usePickerContext("ColorPickerTrigger");
  // The chip is out being the area while the panel is up; its socket stays.
  const chipStyle = useAnimatedStyle(() => ({
    opacity: progress.value > 0.001 ? 0 : 1,
  }));
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
      <View style={styles.socket}>
        <Animated.View
          ref={chipRef}
          collapsable={false}
          style={[styles.chip, chipStyle]}
        >
          <Checkerboard width={CHIP} height={CHIP} />
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.edge,
              { backgroundColor: hex },
            ]}
          />
        </Animated.View>
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

/** One row of the panel, fading and dropping in on its own beat of the spring. */
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
    const start = 0.25 + index * 0.06;
    const q = interpolate(
      progress.value,
      [start, start + 0.4],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: q, transform: [{ translateY: -6 * (1 - q) }] };
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
 * unless there's more room above. A ColorPickerArea inside grows out of the
 * trigger's chip, and the other rows stagger in behind it; closing plays the
 * same motion back. A tap outside, or Android's back button, closes it.
 */
export function ColorPickerContent({
  children,
  accessibilityLabel = "Color picker",
  className = "",
}: ColorPickerContentProps) {
  const { open, setOpen, progress, reduce, hex, chipFrame, triggerFrame } =
    usePickerContext("ColorPickerContent");
  const window = useWindowDimensions();
  const keyboard = useKeyboardHeight(open);
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);
  const [panelHeight, setPanelHeight] = useState(0);
  const [areaFrame, setAreaFrame] = useState<Frame | null>(null);
  const shift = useSharedValue(0);

  const hide = useCallback(() => setPresent(false), []);
  const reportArea = useCallback((frame: Frame) => {
    setAreaFrame((current) =>
      current &&
      current.x === frame.x &&
      current.y === frame.y &&
      current.width === frame.width &&
      current.height === frame.height
        ? current
        : frame,
    );
  }, []);

  useEffect(() => {
    if (!present) return;
    cancelAnimation(progress);
    if (open) {
      progress.value = reduce
        ? withTiming(1, { duration: 150 })
        : withSpring(1, MORPH);
      return;
    }
    Keyboard.dismiss();
    const done = (finished?: boolean) => {
      "worklet";
      if (finished) scheduleOnRN(hide);
    };
    progress.value = reduce
      ? withTiming(0, { duration: 150 }, done)
      : withSpring(0, MORPH, done);
  }, [hide, open, present, progress, reduce]);

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

  const panelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0.05, 0.45], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: shift.value + (isTop ? 6 : -6) * (1 - Math.min(1, p)) },
      ],
    };
  });

  // The area's frame on screen, from its place in the panel.
  const area = areaFrame
    ? { ...areaFrame, x: left + areaFrame.x, y: top + areaFrame.y }
    : null;

  // The chip, growing out of the trigger into the area and back.
  const morphStyle = useAnimatedStyle(() => {
    if (!chipFrame || !area || reduce) return { opacity: 0 };
    const p = Math.min(1, Math.max(0, progress.value));
    const mix = (a: number, b: number) => a + (b - a) * p;
    return {
      opacity: interpolate(p, [0, 0.6, 0.9], [1, 1, 0], Extrapolation.CLAMP),
      left: mix(chipFrame.x, area.x),
      top: mix(chipFrame.y, area.y + shift.value),
      width: mix(chipFrame.width, area.width),
      height: mix(chipFrame.height, area.height),
      borderRadius: mix(CHIP_RADIUS, AREA_RADIUS),
    };
  });

  let row = 0;
  const rows = Children.map(children, (child) => {
    if (isValidElement(child) && child.type === ColorPickerArea) return child;
    row += 1;
    return (
      <Row index={row} progress={progress}>
        {child}
      </Row>
    );
  });

  return (
    <Modal
      transparent
      visible={present}
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => setOpen(false)}
    >
      {/* Gestures inside a modal need their own root on Android. */}
      <GestureHandlerRootView style={styles.root}>
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
        />
        <PanelContext.Provider value={{ reportArea }}>
          <Animated.View
            accessibilityViewIsModal
            accessibilityLabel={accessibilityLabel}
            onLayout={({ nativeEvent }) =>
              setPanelHeight(nativeEvent.layout.height)
            }
            className={`gap-3 rounded-2xl border border-border bg-background p-3 ${className}`}
            style={[styles.panel, { left, top, width }, panelStyle]}
          >
            {rows}
          </Animated.View>
        </PanelContext.Provider>
        <Animated.View
          pointerEvents="none"
          style={[styles.morph, { backgroundColor: hex }, morphStyle]}
        />
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  panel: {
    position: "absolute",
    boxShadow: "0 12px 32px -8px rgba(0, 0, 0, 0.25)",
  },
  morph: { position: "absolute", overflow: "hidden" },
  socket: {
    width: CHIP,
    height: CHIP,
    borderRadius: CHIP_RADIUS,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(127, 127, 127, 0.35)",
  },
  chip: {
    position: "absolute",
    top: -1,
    left: -1,
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
