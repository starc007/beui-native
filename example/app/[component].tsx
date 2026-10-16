import { Stack, useLocalSearchParams } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller";
import { useResolveClassNames } from "uniwind";
import { findEntry } from "../components/registry";

// Space kept between a focused field and the top of the keyboard or toolbar.
const KEYBOARD_GAP = 24;
const TOOLBAR_HEIGHT = 42;

function useToolbarTheme() {
  const { color: primary } = useResolveClassNames("text-foreground");
  const { color: disabled } = useResolveClassNames("text-muted");
  const { backgroundColor: background } = useResolveClassNames("bg-surface");
  const { backgroundColor: ripple } = useResolveClassNames("bg-border");
  // The toolbar follows the system scheme by default; follow the app's theme instead.
  const colors = {
    primary: String(primary),
    disabled: String(disabled),
    background: String(background),
    ripple: String(ripple),
  };
  return { light: colors, dark: colors };
}

export default function ComponentPage() {
  const { component, record } = useLocalSearchParams<{
    component: string;
    record?: string;
  }>();
  const entry = findEntry(component);
  const toolbarTheme = useToolbarTheme();

  if (!entry) {
    return (
      <View className="flex-1 items-center justify-center gap-2 p-6">
        <Stack.Screen options={{ title: "Not found" }} />
        <Text className="text-base text-foreground">
          No component called “{component}”.
        </Text>
      </View>
    );
  }

  const { Showcase, keyboard } = entry;
  return (
    <>
      {/* `?record=1` hides the back button for the beui.dev clips. */}
      <Stack.Screen
        options={{ title: entry.title, headerBackVisible: record !== "1" }}
      />
      <KeyboardAwareScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        bottomOffset={KEYBOARD_GAP + (keyboard ? TOOLBAR_HEIGHT : 0)}
        contentContainerStyle={styles.content}
      >
        <Text className="px-1 text-base leading-6 text-muted">
          {entry.description}
        </Text>
        <Showcase />
      </KeyboardAwareScrollView>
      {keyboard ? <KeyboardToolbar theme={toolbarTheme} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    gap: 32,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
  },
});
