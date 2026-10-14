import "../global.css";

import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useResolveClassNames, useUniwind } from "uniwind";

export default function RootLayout() {
  const { theme } = useUniwind();
  const { backgroundColor: background } = useResolveClassNames("bg-background");
  const { color: foreground } = useResolveClassNames("text-foreground");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: background },
            headerTintColor: foreground,
            headerTitleStyle: { color: foreground },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: "minimal",
            contentStyle: { backgroundColor: background },
          }}
        >
          <Stack.Screen
            name="index"
            // The home screen draws its own header: logo, title and search.
            options={{ title: "beUI", headerShown: false }}
          />
          <Stack.Screen name="[component]" />
        </Stack>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
