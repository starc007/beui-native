import { Stack } from "expo-router/stack";
import { useStackOptions } from "../../components/stack-options";

export default function Layout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen
        name="index"
        options={{ title: "Settings", headerLargeTitleEnabled: true }}
      />
    </Stack>
  );
}
