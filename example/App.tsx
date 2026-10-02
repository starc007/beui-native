import "./global.css";

import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Uniwind, useUniwind } from "uniwind";
import { Button } from "../src";
import { ButtonShowcase } from "./components/button-showcase";

function Playground() {
  const { theme, hasAdaptiveThemes } = useUniwind();
  const selectedTheme = hasAdaptiveThemes ? "system" : theme;

  return (
    <SafeAreaView style={styles.fill}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.content}>
        <View className="gap-3 pt-6">
          <Text className="text-sm font-semibold text-muted">
            beUI / native
          </Text>
          <Text
            accessibilityRole="header"
            className="text-4xl font-semibold tracking-tight text-foreground"
          >
            Button
          </Text>
          <Text className="text-base leading-6 text-muted">
            Small details. A better first touch.
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {(["system", "light", "dark"] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={selectedTheme === value ? "primary" : "ghost"}
              accessibilityLabel={`${value} theme`}
              accessibilityState={{ selected: selectedTheme === value }}
              onPress={() => Uniwind.setTheme(value)}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </Button>
          ))}
        </View>
        <ButtonShowcase />
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
    maxWidth: 640,
    alignSelf: "center",
    padding: 24,
    gap: 24,
    paddingBottom: 40,
  },
});
