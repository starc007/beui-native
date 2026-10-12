import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Uniwind, useResolveClassNames, useUniwind } from "uniwind";
import { Button } from "../../src";
import { entries, groups } from "../components/registry";

function ThemePicker() {
  const { theme, hasAdaptiveThemes } = useUniwind();
  const selected = hasAdaptiveThemes ? "system" : theme;

  return (
    <View className="flex-row flex-wrap gap-2">
      {(["system", "light", "dark"] as const).map((value) => (
        <Button
          key={value}
          size="sm"
          variant={selected === value ? "primary" : "ghost"}
          accessibilityLabel={`${value} theme`}
          accessibilityState={{ selected: selected === value }}
          onPress={() => Uniwind.setTheme(value)}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Button>
      ))}
    </View>
  );
}

function Chevron() {
  const { color } = useResolveClassNames("text-muted");
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ color, fontSize: 20, lineHeight: 22 }}
    >
      ›
    </Text>
  );
}

export default function ComponentList() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="w-full max-w-160 self-center gap-8 px-5 pt-2 pb-12"
    >
      <View className="gap-4">
        <Text className="text-base leading-6 text-muted">
          {entries.length} animated components for React Native. Small details,
          a better first touch.
        </Text>
        <ThemePicker />
      </View>

      {groups.map((group) => (
        <View key={group.title} className="gap-2">
          <Text
            accessibilityRole="header"
            className="px-1 text-xs font-semibold uppercase tracking-wider text-muted"
          >
            {group.title}
          </Text>
          <View className="overflow-hidden rounded-2xl border border-border bg-surface">
            {group.items.map((entry, index) => (
              <Link key={entry.slug} href={`/${entry.slug}`} asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityHint={entry.description}
                  className={`min-h-16 flex-row items-center gap-3 px-4 py-3 active:bg-background ${index > 0 ? "border-t border-border" : ""}`}
                >
                  <View className="flex-1 gap-0.5">
                    <Text className="text-base font-medium text-foreground">
                      {entry.title}
                    </Text>
                    <Text numberOfLines={1} className="text-sm text-muted">
                      {entry.description}
                    </Text>
                  </View>
                  <Chevron />
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
