import "./global.css";

import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Uniwind, useUniwind } from "uniwind";
import { motion, Surface } from "../src";

function Playground() {
  const { theme, hasAdaptiveThemes } = useUniwind();
  const [presses, setPresses] = useState(0);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const selectedTheme = hasAdaptiveThemes ? "system" : theme;

  return (
    <SafeAreaView style={styles.fill}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.content}>
        <View className="gap-3 py-6">
          <Text className="text-sm font-semibold text-muted">
            beUI / native
          </Text>
          <Text
            accessibilityRole="header"
            className="text-4xl font-semibold tracking-tight text-foreground"
          >
            A native beginning.
          </Text>
          <Text className="text-base leading-6 text-muted">
            A place to build, feel, and refine our components.
          </Text>
        </View>
        <Surface className="gap-4">
          <Text
            accessibilityRole="header"
            className="text-lg font-semibold text-foreground"
          >
            Appearance
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(["system", "light", "dark"] as const).map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedTheme === value }}
                onPress={() => Uniwind.setTheme(value)}
                className={`min-h-12 justify-center rounded-xl px-4 ${selectedTheme === value ? "bg-primary" : "bg-background"}`}
              >
                <Text
                  className={`text-base font-medium capitalize ${selectedTheme === value ? "text-on-primary" : "text-foreground"}`}
                >
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>
        </Surface>
        <Surface className="gap-4">
          <View className="gap-2">
            <Text
              accessibilityRole="header"
              className="text-lg font-semibold text-foreground"
            >
              A little feedback
            </Text>
            <Text className="text-base leading-6 text-muted">
              Press and hold, then let go. Motion follows your device’s
              reduced-motion setting.
            </Text>
          </View>
          <Animated.View style={animatedStyle}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPresses((value) => value + 1)}
              onPressIn={() => {
                scale.value = withTiming(0.97, motion.press);
              }}
              onPressOut={() => {
                scale.value = withTiming(1, motion.press);
              }}
              className="min-h-14 items-center justify-center rounded-xl bg-primary px-5 py-3"
            >
              <Text className="text-base font-semibold text-on-primary">
                Try a press
              </Text>
            </Pressable>
          </Animated.View>
          <Text accessibilityLiveRegion="polite" className="text-sm text-muted">
            {presses === 0
              ? "Ready when you are."
              : `${presses} ${presses === 1 ? "press" : "presses"}. Keep going.`}
          </Text>
        </Surface>
        <Text className="px-1 text-sm leading-5 text-muted">
          First up: Button, Switch, and Slider.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <View className="flex-1 bg-background">
          <Playground />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
});
