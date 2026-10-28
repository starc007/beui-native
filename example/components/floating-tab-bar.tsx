// Storyboard: a rounded bar floats above the bottom edge. A soft pill sits
// behind the selected tab and springs to the next one on SPRING_LAYOUT;
// each tab's icon and label crossfade from muted to primary as the pill
// arrives. Pressing a tab scales it to 0.94 on SPRING_PRESS and ticks a
// selection haptic when the tab changes. Reduced motion moves the pill and
// colours in place, without springing or scaling.
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useEffect, useState } from "react";
import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../src/hooks/use-reduced-motion";
import { SPRING_LAYOUT, SPRING_PRESS } from "../../src/styles/motion";
import { APP_TABS, TAB_ICONS } from "./app-tabs-data";

const BAR_PADDING = 6;
const ICON_SIZE = 22;
const PRESSED_SCALE = 0.94;

/** Hides the bar while the keyboard is up, so it never rides above it. */
function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

function TabItem({
  index,
  label,
  icon,
  focused,
  position,
  colors,
  reduceMotion,
  onPress,
  onLongPress,
}: {
  index: number;
  label: string;
  icon: (typeof TAB_ICONS)[keyof typeof TAB_ICONS];
  focused: boolean;
  position: SharedValue<number>;
  colors: { active: string; inactive: string };
  reduceMotion: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const pressed = useSharedValue(1);
  // 1 while the pill sits on this tab, 0 one tab away or more.
  const activeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(position.value - index),
      [0, 1],
      [1, 0],
      "clamp",
    ),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      Math.min(Math.abs(position.value - index), 1),
      [0, 1],
      [colors.active, colors.inactive],
    ),
  }));
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));
  const press = (to: number) => {
    if (!reduceMotion) pressed.value = withSpring(to, SPRING_PRESS);
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => press(PRESSED_SCALE)}
      onPressOut={() => press(1)}
      style={styles.item}
    >
      <Animated.View style={[styles.itemContent, scaleStyle]}>
        <View style={styles.icon}>
          <HugeiconsIcon
            icon={icon}
            size={ICON_SIZE}
            color={colors.inactive}
            strokeWidth={1.6}
          />
          <Animated.View style={[StyleSheet.absoluteFill, activeStyle]}>
            <HugeiconsIcon
              icon={icon}
              size={ICON_SIZE}
              color={colors.active}
              strokeWidth={1.8}
            />
          </Animated.View>
        </View>
        <Animated.Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
          style={[styles.label, labelStyle]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * The showcase's Android tab bar: a floating rounded bar with a sliding
 * pill, in place of the flat Material bar. iOS keeps its native tab bar.
 * Presses follow React Navigation's rules: tabPress is emitted first and can
 * be prevented, and pressing the current tab only emits the event, which
 * lets its stack pop to the top.
 */
export function FloatingTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
  hidden = false,
}: BottomTabBarProps & { hidden?: boolean }) {
  const reduceMotion = useReducedMotionPreference();
  const keyboardVisible = useKeyboardVisible();
  const [barWidth, setBarWidth] = useState(0);
  const position = useSharedValue(state.index);
  const { color: active } = useResolveClassNames("text-primary");
  const { color: inactive } = useResolveClassNames("text-muted");
  const { backgroundColor: pill } = useResolveClassNames("bg-border");
  const colors = { active: String(active), inactive: String(inactive) };

  useEffect(() => {
    position.value = reduceMotion
      ? state.index
      : withSpring(state.index, SPRING_LAYOUT);
  }, [state.index, reduceMotion, position]);

  const count = state.routes.length;
  const itemWidth = barWidth > 0 ? (barWidth - BAR_PADDING * 2) / count : 0;
  const pillStyle = useAnimatedStyle(() => ({
    width: itemWidth,
    transform: [{ translateX: position.value * itemWidth }],
  }));

  if (hidden || keyboardVisible) return null;

  return (
    <View
      className="bg-background"
      style={[styles.dock, { paddingBottom: insets.bottom + 10 }]}
    >
      <View
        accessibilityRole="tablist"
        className="flex-row rounded-full border border-border bg-background"
        style={styles.bar}
        onLayout={({ nativeEvent }) => setBarWidth(nativeEvent.layout.width)}
      >
        {itemWidth > 0 ? (
          <Animated.View
            style={[styles.pill, { backgroundColor: String(pill) }, pillStyle]}
          />
        ) : null}
        {state.routes.map((route, index) => {
          const tab = APP_TABS.find((item) => item.route === route.name);
          const options = descriptors[route.key]?.options;
          const label = tab?.label ?? options?.title ?? route.name;
          const focused = index === state.index;
          return (
            <TabItem
              key={route.key}
              index={index}
              label={label}
              icon={TAB_ICONS[tab?.icon ?? "all"]}
              focused={focused}
              position={position}
              colors={colors}
              reduceMotion={reduceMotion}
              onPress={() => {
                const event = emitter.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  void Haptics.selectionAsync();
                  navigateToTab(route.key);
                }
              }}
              onLongPress={() =>
                emitter.emit({ type: "tabLongPress", target: route.key })
              }
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { paddingHorizontal: 16, paddingTop: 8 },
  bar: { padding: BAR_PADDING },
  pill: {
    position: "absolute",
    top: BAR_PADDING,
    bottom: BAR_PADDING,
    left: BAR_PADDING,
    borderRadius: 999,
  },
  item: { flex: 1 },
  itemContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 8,
  },
  icon: { width: ICON_SIZE, height: ICON_SIZE },
  label: { fontSize: 11, fontWeight: "500" },
});
