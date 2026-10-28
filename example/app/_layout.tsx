import "../global.css";

import { useGlobalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useUniwind } from "uniwind";
import { FloatingAppTabs, NativeAppTabs } from "../components/app-tabs";

export default function RootLayout() {
  const { theme } = useUniwind();
  // `?record=1` hides the tab bar for the beui.dev clips.
  const { record } = useGlobalSearchParams<{ record?: string }>();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        {/* iOS keeps the system tab bar; Android gets the floating one. */}
        {Platform.OS === "android" ? (
          <FloatingAppTabs hidden={record === "1"} />
        ) : (
          <NativeAppTabs hidden={record === "1"} />
        )}
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
