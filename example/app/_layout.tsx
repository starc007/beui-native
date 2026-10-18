import "../global.css";

import { useGlobalSearchParams } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useResolveClassNames, useUniwind } from "uniwind";

export default function RootLayout() {
  const { theme } = useUniwind();
  // `?record=1` hides the tab bar for the beui.dev clips.
  const { record } = useGlobalSearchParams<{ record?: string }>();
  const { color: primary } = useResolveClassNames("text-primary");
  const { backgroundColor: surface } = useResolveClassNames("bg-background");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        {/* Solid at the edge too: the lists start with a header, not a scroll view,
            so the tab bar can't tell when they reach the bottom. */}
        <NativeTabs
          hidden={record === "1"}
          tintColor={primary as string}
          backgroundColor={surface as string}
          disableTransparentOnScrollEdge
        >
          <NativeTabs.Trigger name="(home)">
            <NativeTabs.Trigger.Icon sf="square.grid.2x2" md="apps" />
            <NativeTabs.Trigger.Label>All</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="components">
            <NativeTabs.Trigger.Icon sf="square.stack.3d.up" md="widgets" />
            <NativeTabs.Trigger.Label>Components</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="agents">
            <NativeTabs.Trigger.Icon sf="sparkles" md="auto_awesome" />
            <NativeTabs.Trigger.Label>Agents</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="settings">
            <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
            <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
