import { memo, useEffect, useRef } from "react";
import {
  type AccessibilityActionEvent,
  Platform,
  StyleSheet,
  View,
  type ViewProps,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { EASE_OUT, SPRING_GLIDE, SPRING_PRESS } from "../../styles/motion";
import { hueColor, rgbaString } from "./color";
import { usePickerContext } from "./context";

// The loupe lifts with a visible overshoot so it reads as picked up, unlike
// the critically damped glide the thumb itself rides on.
const LOUPE_LIFT = { stiffness: 520, damping: 24, mass: 0.6 };
const LOUPE_DROP = { duration: 120, easing: EASE_OUT };
// Drag speed, in track widths per second, swings the loupe like a pendulum.
const LOUPE_TILT = 16;
const LOUPE_TILT_SPEED = 4;
const THUMB = 18;
// Sliders inset the thumb's path by half a thumb, so it never leaves the track.
const RAIL_INSET = THUMB / 2;
const CHECK = 4;
const CHECK_LIGHT = "#fafafa";
const CHECK_DARK = "#d4d4d8";

/** A gradient fill, through experimental_backgroundImage on native. */
export function gradient(css: string) {
  return Platform.OS === "web"
    ? ({ backgroundImage: css } as object)
    : { experimental_backgroundImage: css };
}

/**
 * The transparency checkerboard. React Native has no conic gradient, so it's
 * drawn from small squares, once per size.
 */
export const Checkerboard = memo(function Checkerboard({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const columns = Math.ceil(width / CHECK);
  const rows = Math.ceil(height / CHECK);
  const squares: { left: number; top: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = row % 2; column < columns; column += 2) {
      squares.push({ left: column * CHECK, top: row * CHECK });
    }
  }
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: CHECK_LIGHT }]}
    >
      {squares.map(({ left, top }) => (
        <View key={`${left}-${top}`} style={[styles.check, { left, top }]} />
      ))}
    </View>
  );
});

/** Where a touch lands on a track, kept on the UI thread while dragging. */
function useTrack({
  axes,
  inset,
  onPoint,
  onEnd,
  disabled,
}: {
  axes: "x" | "xy";
  inset: number;
  onPoint: (x: number, y: number) => void;
  onEnd: () => void;
  disabled: boolean;
}) {
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const dragging = useSharedValue(false);
  const lift = useSharedValue(0);
  const tilt = useSharedValue(0);

  const place = (px: number, py: number) => {
    "worklet";
    const span = Math.max(1, width.value - inset * 2);
    const nx = Math.min(1, Math.max(0, (px - inset) / span));
    const ny =
      axes === "xy"
        ? Math.min(1, Math.max(0, py / Math.max(1, height.value)))
        : 0;
    x.value = nx;
    y.value = ny;
    scheduleOnRN(onPoint, nx, ny);
  };

  // A finger down jumps the thumb there; moving drags it.
  const gesture = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(0)
    .onBegin((event) => {
      dragging.value = true;
      lift.value = withSpring(1, LOUPE_LIFT);
      place(event.x, event.y);
    })
    .onUpdate((event) => {
      place(event.x, event.y);
      const speed = event.velocityX / Math.max(1, width.value);
      tilt.value = withSpring(
        Math.max(-1, Math.min(1, speed / LOUPE_TILT_SPEED)) * -LOUPE_TILT,
        SPRING_PRESS,
      );
    })
    .onFinalize(() => {
      dragging.value = false;
      lift.value = withTiming(0, LOUPE_DROP);
      tilt.value = withSpring(0, SPRING_PRESS);
      scheduleOnRN(onEnd);
    });

  return { gesture, width, height, x, y, dragging, lift, tilt };
}

/** Thumbs follow the color when it changes from elsewhere, gliding there. */
function useFollow(
  shared: SharedValue<number>,
  target: number,
  dragging: SharedValue<boolean>,
  reduce: boolean,
) {
  useEffect(() => {
    if (dragging.value) return;
    shared.value = reduce ? target : withSpring(target, SPRING_GLIDE);
  }, [dragging, reduce, shared, target]);
}

function Thumb({
  x,
  y,
  width,
  height,
  inset,
  lift,
  tilt,
  color,
  reduce,
}: {
  x: SharedValue<number>;
  y?: SharedValue<number>;
  width: SharedValue<number>;
  height: SharedValue<number>;
  inset: number;
  lift: SharedValue<number>;
  tilt: SharedValue<number>;
  color: string;
  reduce: boolean;
}) {
  const position = useAnimatedStyle(() => {
    const span = Math.max(0, width.value - inset * 2);
    return {
      transform: [
        { translateX: inset + x.value * span - THUMB / 2 },
        {
          translateY: y
            ? y.value * height.value - THUMB / 2
            : height.value / 2 - THUMB / 2,
        },
      ],
    };
  });
  // The thumb tucks in while the loupe is up, so the finger's color shows above.
  const dot = useAnimatedStyle(() => ({
    transform: [{ scale: reduce ? 1 : 1 - 0.22 * lift.value }],
  }));
  const loupe = useAnimatedStyle(() => {
    const l = reduce ? 0 : lift.value;
    return {
      opacity: Math.min(1, Math.max(0, l)),
      transform: [
        { translateY: 16 * (1 - l) },
        { rotate: `${tilt.value}deg` },
        { scale: 0.3 + 0.7 * l },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.thumbSlot, position]}>
      <Animated.View style={[styles.loupe, loupe]}>
        {/* A teardrop: a square with one sharp corner, turned to point down.
            The color is the drop's own background, which follows its mixed
            corners; iOS wouldn't clip a filled child to them. */}
        <View style={[styles.drop, { backgroundColor: color }]} />
      </Animated.View>
      <Animated.View style={[styles.dot, { backgroundColor: color }, dot]} />
    </Animated.View>
  );
}

export type ColorPickerAreaProps = Omit<ViewProps, "children"> & {
  /** Accessible name. Defaults to "Saturation and brightness". */
  label?: string;
  className?: string;
};

/**
 * The saturation and brightness area. Drag anywhere; a loupe lifts above the
 * finger to show the color under it.
 */
export function ColorPickerArea({
  label = "Saturation and brightness",
  className = "",
  style,
  ...props
}: ColorPickerAreaProps) {
  const { hsva, rgba, update, commit, disabled, reduce } =
    usePickerContext("ColorPickerArea");
  const latest = useRef(hsva);
  latest.current = hsva;

  const track = useTrack({
    axes: "xy",
    inset: 0,
    onPoint: (x, y) =>
      update({ ...latest.current, s: x * 100, v: (1 - y) * 100 }),
    onEnd: commit,
    disabled,
  });
  useFollow(track.x, hsva.s / 100, track.dragging, reduce);
  useFollow(track.y, 1 - hsva.v / 100, track.dragging, reduce);

  const s = Math.round(hsva.s);
  const v = Math.round(hsva.v);
  const nudge = (event: AccessibilityActionEvent) => {
    const step = 5;
    const name = event.nativeEvent.actionName;
    const next =
      name === "increment"
        ? { ...hsva, s: hsva.s + step }
        : name === "decrement"
          ? { ...hsva, s: hsva.s - step }
          : name === "brighter"
            ? { ...hsva, v: hsva.v + step }
            : { ...hsva, v: hsva.v - step };
    update(next);
    commit();
  };

  return (
    <GestureDetector gesture={track.gesture}>
      <Animated.View
        {...props}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        aria-valuetext={`Saturation ${s}%, brightness ${v}%`}
        accessibilityActions={[
          { name: "increment", label: "More saturated" },
          { name: "decrement", label: "Less saturated" },
          { name: "brighter", label: "Brighter" },
          { name: "darker", label: "Darker" },
        ]}
        onAccessibilityAction={nudge}
        onLayout={(event) => {
          track.width.value = event.nativeEvent.layout.width;
          track.height.value = event.nativeEvent.layout.height;
          props.onLayout?.(event);
        }}
        className={`h-40 w-full rounded-xl ${className}`}
        style={[{ backgroundColor: hueColor(hsva.h) }, style]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.fill,
            styles.areaRound,
            gradient(
              "linear-gradient(to right, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0))",
            ),
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.fill,
            styles.areaRound,
            gradient(
              "linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0))",
            ),
          ]}
        />
        <View
          pointerEvents="none"
          style={[styles.fill, styles.areaRound, styles.inset]}
        />
        <Thumb
          x={track.x}
          y={track.y}
          width={track.width}
          height={track.height}
          inset={0}
          lift={track.lift}
          tilt={track.tilt}
          color={rgbaString(rgba, 1)}
          reduce={reduce}
        />
      </Animated.View>
    </GestureDetector>
  );
}

function ChannelSlider({
  value,
  max,
  onValue,
  label,
  valueText,
  background,
  thumbColor,
  checker = false,
  className = "",
}: {
  value: number;
  max: number;
  onValue: (next: number) => void;
  label: string;
  valueText: string;
  background: string;
  thumbColor: string;
  checker?: boolean;
  className?: string;
}) {
  const { commit, disabled, reduce } = usePickerContext("ColorPicker slider");
  const track = useTrack({
    axes: "x",
    inset: RAIL_INSET,
    onPoint: (x) => onValue(x * max),
    onEnd: commit,
    disabled,
  });
  useFollow(track.x, value / max, track.dragging, reduce);
  const widthRef = useRef(0);

  return (
    <GestureDetector gesture={track.gesture}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        aria-valuetext={valueText}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) => {
          const step = Math.max(1, Math.round(max / 36));
          onValue(
            value +
              (event.nativeEvent.actionName === "increment" ? step : -step),
          );
          commit();
        }}
        onLayout={(event) => {
          widthRef.current = event.nativeEvent.layout.width;
          track.width.value = event.nativeEvent.layout.width;
          track.height.value = event.nativeEvent.layout.height;
        }}
        // A tall touch area around a thin track.
        hitSlop={{ top: 12, bottom: 12 }}
        className={`h-3.5 w-full rounded-full ${className}`}
      >
        <View style={[styles.fill, styles.round, styles.clip]}>
          {checker ? <Checkerboard width={320} height={14} /> : null}
          <View style={[styles.fill, gradient(background)]} />
          <View style={[styles.fill, styles.round, styles.inset]} />
        </View>
        <Thumb
          x={track.x}
          width={track.width}
          height={track.height}
          inset={RAIL_INSET}
          lift={track.lift}
          tilt={track.tilt}
          color={thumbColor}
          reduce={reduce}
        />
      </View>
    </GestureDetector>
  );
}

export type ColorPickerSliderProps = { label?: string; className?: string };

export function ColorPickerHue({
  label = "Hue",
  className,
}: ColorPickerSliderProps) {
  const { hsva, update } = usePickerContext("ColorPickerHue");
  const latest = useRef(hsva);
  latest.current = hsva;
  return (
    <ChannelSlider
      value={hsva.h}
      max={360}
      onValue={(next) => update({ ...latest.current, h: next })}
      label={label}
      valueText={`${Math.round(hsva.h)} degrees`}
      background="linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
      thumbColor={hueColor(hsva.h)}
      className={className}
    />
  );
}

/** Renders nothing when the picker has `alpha={false}`. */
export function ColorPickerAlpha({
  label = "Opacity",
  className,
}: ColorPickerSliderProps) {
  const { hsva, rgba, alpha, update } = usePickerContext("ColorPickerAlpha");
  const latest = useRef(hsva);
  latest.current = hsva;
  if (!alpha) return null;
  return (
    <ChannelSlider
      value={hsva.a * 100}
      max={100}
      onValue={(next) =>
        update({ ...latest.current, a: Math.round(next) / 100 })
      }
      label={label}
      valueText={`${Math.round(hsva.a * 100)}%`}
      background={`linear-gradient(to right, ${rgbaString(rgba, 0)}, ${rgbaString(rgba, 1)})`}
      thumbColor={rgbaString(rgba)}
      checker
      className={className}
    />
  );
}

/** The current color over a transparency checkerboard. Decorative. */
export function ColorPickerSwatch({ className = "" }: { className?: string }) {
  const { hex } = usePickerContext("ColorPickerSwatch");
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`size-9 overflow-hidden rounded-lg ${className}`}
    >
      <Checkerboard width={36} height={36} />
      <View
        style={[
          styles.fill,
          styles.inset,
          styles.swatchRound,
          { backgroundColor: hex },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill },
  round: { borderRadius: 999 },
  clip: { overflow: "hidden" },
  // A faint inner edge so light colors don't melt into the panel.
  inset: { borderWidth: 1, borderColor: "rgba(0, 0, 0, 0.1)" },
  areaRound: { borderRadius: 12 },
  swatchRound: { borderRadius: 8 },
  check: {
    position: "absolute",
    width: CHECK,
    height: CHECK,
    backgroundColor: CHECK_DARK,
  },
  thumbSlot: {
    position: "absolute",
    left: 0,
    top: 0,
    width: THUMB,
    height: THUMB,
  },
  dot: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    borderColor: "#ffffff",
    boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.25)",
  },
  loupe: {
    position: "absolute",
    left: THUMB / 2 - 20,
    bottom: THUMB + 12,
    width: 40,
    height: 40,
    transformOrigin: "50% 130%",
  },
  drop: {
    width: 40,
    height: 40,
    borderWidth: 3,
    borderColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 0,
    transform: [{ rotate: "-45deg" }],
    boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1), 0 6px 16px rgba(0, 0, 0, 0.28)",
  },
});
