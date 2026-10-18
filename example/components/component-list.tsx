import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useResolveClassNames } from "uniwind";
import { HomeHeader } from "./home-header";
import { type ComponentGroup, groups, variantCount } from "./registry";

export const AGENTS_GROUP = "AI agents";

export type ListFilter = "all" | "components" | "agents";

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

function groupsFor(filter: ListFilter): ComponentGroup[] {
  if (filter === "agents")
    return groups.filter((group) => group.title === AGENTS_GROUP);
  if (filter === "components")
    return groups.filter((group) => group.title !== AGENTS_GROUP);
  return groups;
}

const TITLES: Record<ListFilter, string> = {
  all: "beUI",
  components: "Components",
  agents: "Agents",
};

/**
 * A searchable list of showcases for one tab. Links open in the tab's own
 * stack, under `basePath`, so back returns to this list.
 */
export function ComponentList({
  filter,
  basePath,
}: {
  filter: ListFilter;
  basePath: string;
}) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const shown = groupsFor(filter)
    .map((group) => ({
      ...group,
      items: group.items.filter((entry) =>
        `${entry.title} ${entry.description} ${group.title}`
          .toLowerCase()
          .includes(search),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const count = groupsFor(filter)
    .flatMap((group) => group.items)
    .reduce((total, entry) => total + (entry.variants ?? 1), 0);
  const intro =
    filter === "agents"
      ? `${count} animated parts for chats and AI agents: messages, tools, approvals and more.`
      : filter === "components"
        ? `${count} animated controls, forms, lists and feedback.`
        : `${variantCount} animated components and variants for React Native. Small details, a better first touch.`;

  return (
    <View className="flex-1 bg-background">
      <HomeHeader
        title={TITLES[filter]}
        query={query}
        onQueryChange={setQuery}
      />
      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="w-full max-w-160 self-center gap-8 px-5 pt-2 pb-12"
      >
        {search ? null : (
          <Text className="text-base leading-6 text-muted">{intro}</Text>
        )}

        {search && shown.length === 0 ? (
          <Text
            accessibilityLiveRegion="polite"
            className="py-12 text-center text-base text-muted"
          >
            No components match “{query.trim()}”.
          </Text>
        ) : null}

        {shown.map((group) => (
          <View key={group.title} className="gap-2">
            <Text
              accessibilityRole="header"
              className="px-1 text-xs font-semibold uppercase tracking-wider text-muted"
            >
              {group.title}
            </Text>
            <View className="overflow-hidden rounded-2xl border border-border bg-surface">
              {group.items.map((entry, index) => (
                <Link
                  key={entry.slug}
                  href={`${basePath}${entry.slug}`}
                  asChild
                >
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
    </View>
  );
}
