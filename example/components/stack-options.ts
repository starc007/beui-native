import { useResolveClassNames } from "uniwind";

/** Header colors that follow the app's theme, shared by every tab's stack. */
export function useStackOptions() {
  const { backgroundColor: background } = useResolveClassNames("bg-background");
  const { color: foreground } = useResolveClassNames("text-foreground");
  return {
    headerStyle: { backgroundColor: background },
    headerTintColor: foreground,
    headerTitleStyle: { color: foreground },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: "minimal" as const,
    contentStyle: { backgroundColor: background },
  };
}
