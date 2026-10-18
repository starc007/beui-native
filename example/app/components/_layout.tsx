import { Stack } from "expo-router/stack";
import { useStackOptions } from "../../components/stack-options";

// A deep link straight to a component still gets the list underneath, so
// back returns to it.
export const unstable_settings = { initialRouteName: "index" };

export default function Layout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[component]" />
    </Stack>
  );
}
