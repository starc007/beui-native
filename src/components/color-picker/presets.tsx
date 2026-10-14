import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { SPRING_LAYOUT, SPRING_PRESS } from "../../styles/motion";
import { formatHex, parseHex, rgbaToHsva } from "./color";
import { usePickerContext } from "./context";
import { Checkerboard } from "./surfaces";

const SIZE = 24;
const RING_GAP = 3;
// The ring hops between swatches over a low arc, higher the further it goes.
const HOP = 0.15;

type Spot = { x: number; y: number };

const PresetsContext = createContext<{
  place: (value: string, spot: Spot) => void;
} | null>(null);

export type ColorPickerPresetsProps = {
  children: ReactNode;
  /** Names the group for screen readers, such as "Presets". */
  accessibilityLabel?: string;
  className?: string;
};

/** A row of preset swatches. A ring marks the one matching the current color. */
export function ColorPickerPresets({
  children,
  accessibilityLabel,
  className = "",
}: ColorPickerPresetsProps) {
  const { hex, reduce } = usePickerContext("ColorPickerPresets");
  // On web, borders resolve per side.
  const ringClass = useResolveClassNames("border-foreground/70");
  const ring = ringClass.borderColor ?? ringClass.borderTopColor;
  const spots = useRef(new Map<string, Spot>());
  const [version, setVersion] = useState(0);
  const place = useCallback((value: string, spot: Spot) => {
    const known = spots.current.get(value);
    if (known && known.x === spot.x && known.y === spot.y) return;
    spots.current.set(value, spot);
    setVersion((n) => n + 1);
  }, []);

  const from = useSharedValue<Spot>({ x: 0, y: 0 });
  const to = useSharedValue<Spot>({ x: 0, y: 0 });
  const travel = useSharedValue(1);
  const shown = useSharedValue(0);
  const last = useRef<Spot | null>(null);

  useEffect(() => {
    const target = spots.current.get(hex);
    if (!target) {
      shown.value = withTiming(0, { duration: 120 });
      last.current = null;
      return;
    }
    const start = last.current;
    last.current = target;
    if (!start || reduce) {
      from.value = target;
      to.value = target;
      travel.value = 1;
      shown.value = withTiming(1, { duration: 120 });
      return;
    }
    if (start.x === target.x && start.y === target.y) return;
    from.value = start;
    to.value = target;
    travel.value = 0;
    travel.value = withSpring(1, SPRING_LAYOUT);
    shown.value = 1;
  }, [from, hex, reduce, shown, to, travel, version]);

  const ringStyle = useAnimatedStyle(() => {
    const t = travel.value;
    const a = from.value;
    const b = to.value;
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const arc =
      HOP * distance * Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
    return {
      opacity: shown.value,
      transform: [
        { translateX: a.x + (b.x - a.x) * t - RING_GAP },
        { translateY: a.y + (b.y - a.y) * t - RING_GAP - arc },
      ],
    };
  });

  return (
    <PresetsContext.Provider value={{ place }}>
      <View
        accessibilityLabel={accessibilityLabel}
        className={`flex-row flex-wrap gap-2 ${className}`}
      >
        {children}
        <Animated.View
          pointerEvents="none"
          style={[styles.ring, { borderColor: ring }, ringStyle]}
        />
      </View>
    </PresetsContext.Provider>
  );
}

export type ColorPickerPresetProps = {
  /** The hex color this preset applies. */
  value: string;
  /** The color's name for screen readers. Defaults to the hex. */
  label?: string;
  onPress?: () => void;
  className?: string;
};

export function ColorPickerPreset({
  value,
  label,
  onPress,
  className = "",
}: ColorPickerPresetProps) {
  const { hsva, hex, update, commit, disabled, reduce } =
    usePickerContext("ColorPickerPreset");
  const presets = useContext(PresetsContext);
  const parsed = parseHex(value);
  const normalized = parsed ? formatHex(parsed) : value;
  const selected = normalized === hex;
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? normalized}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      hitSlop={6}
      onLayout={({ nativeEvent }) =>
        presets?.place(normalized, {
          x: nativeEvent.layout.x,
          y: nativeEvent.layout.y,
        })
      }
      onPressIn={() => {
        if (!reduce) scale.value = withSpring(0.88, SPRING_PRESS);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_PRESS);
      }}
      onPress={() => {
        onPress?.();
        if (!parsed) return;
        update(rgbaToHsva(parsed, hsva));
        commit();
      }}
      className={className}
    >
      <Animated.View style={[styles.swatch, pressStyle]}>
        <Checkerboard width={SIZE} height={SIZE} />
        <View style={[styles.color, { backgroundColor: normalized }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  swatch: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: "hidden",
  },
  color: {
    ...StyleSheet.absoluteFill,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  ring: {
    position: "absolute",
    left: 0,
    top: 0,
    width: SIZE + RING_GAP * 2,
    height: SIZE + RING_GAP * 2,
    borderRadius: (SIZE + RING_GAP * 2) / 2,
    borderWidth: 2,
  },
});
