import * as Linking from "expo-linking";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Uniwind, useResolveClassNames, useUniwind } from "uniwind";
import { Tabs, TabsList, TabsTrigger } from "../../src";
import { AGENTS_GROUP } from "./component-list";
import { groups, variantCount } from "./registry";

const agentCount = groups
  .filter((group) => group.title === AGENTS_GROUP)
  .flatMap((group) => group.items).length;
const componentCount =
  groups.flatMap((group) => group.items).length - agentCount;

function Row({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const { color: muted } = useResolveClassNames("text-muted");
  const content = (
    <View className="min-h-14 flex-row items-center gap-3 px-4 py-3">
      <Text className="flex-1 text-base text-foreground">{label}</Text>
      {value ? <Text className="text-base text-muted">{value}</Text> : null}
      {onPress ? (
        <Text style={{ color: muted, fontSize: 20, lineHeight: 22 }}>›</Text>
      ) : null}
    </View>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      className="active:bg-background"
    >
      {content}
    </Pressable>
  ) : (
    content
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text
        accessibilityRole="header"
        className="px-1 text-xs font-semibold uppercase tracking-wider text-muted"
      >
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-border bg-surface">
        {children}
      </View>
    </View>
  );
}

/** Appearance and links about the library. */
export function SettingsScreen() {
  const { theme, hasAdaptiveThemes } = useUniwind();
  const selected = hasAdaptiveThemes ? "system" : theme;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="w-full max-w-160 self-center gap-8 px-5 pt-4 pb-12"
    >
      <Section title="Appearance">
        <View className="gap-3 p-4">
          <Text className="text-base text-foreground">Theme</Text>
          <Tabs
            value={selected}
            onValueChange={(value) =>
              Uniwind.setTheme(value as "system" | "light" | "dark")
            }
          >
            <TabsList accessibilityLabel="Theme">
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="light">Light</TabsTrigger>
              <TabsTrigger value="dark">Dark</TabsTrigger>
            </TabsList>
          </Tabs>
        </View>
      </Section>
      <Section title="Library">
        <Row label="Components" value={String(componentCount)} />
        <View className="mx-4 h-px bg-border" />
        <Row label="AI agents" value={String(agentCount)} />
        <View className="mx-4 h-px bg-border" />
        <Row label="With variants" value={String(variantCount)} />
      </Section>
      <Section title="Links">
        <Row
          label="beui.dev"
          onPress={() => void Linking.openURL("https://beui.dev/react-native")}
        />
        <View className="mx-4 h-px bg-border" />
        <Row
          label="GitHub"
          onPress={() =>
            void Linking.openURL("https://github.com/starc007/beui-native")
          }
        />
      </Section>
    </ScrollView>
  );
}
