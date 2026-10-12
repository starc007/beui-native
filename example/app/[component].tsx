import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { findEntry } from "../components/registry";

export default function ComponentPage() {
  const { component } = useLocalSearchParams<{ component: string }>();
  const entry = findEntry(component);

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

  const { Showcase } = entry;
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="w-full max-w-160 self-center gap-4 px-5 pt-2 pb-12"
    >
      <Stack.Screen options={{ title: entry.title }} />
      <Text className="px-1 text-base leading-6 text-muted">
        {entry.description}
      </Text>
      <Showcase />
    </ScrollView>
  );
}
