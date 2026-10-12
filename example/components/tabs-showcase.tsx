import { Text, View } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../src";

const SECTIONS = [
  "Overview",
  "Activity",
  "Analytics",
  "Members",
  "Billing",
  "Settings",
];

function Label({ children }: { children: string }) {
  return (
    <Text className="text-xs font-semibold uppercase tracking-wider text-muted">
      {children}
    </Text>
  );
}

export function TabsShowcase() {
  return (
    // Tab lists use the surface color, so this card uses the page background.
    <View className="gap-6 rounded-2xl border border-border bg-background p-5">
      <View className="gap-1">
        <Text
          accessibilityRole="header"
          className="text-lg font-semibold text-foreground"
        >
          Tabs
        </Text>
        <Text className="text-sm leading-5 text-muted">
          The indicator glides between tabs, and labels change color exactly
          where it passes.
        </Text>
      </View>

      <View className="gap-2">
        <Label>Pill</Label>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Text className="text-sm text-muted">High-level summary.</Text>
          </TabsContent>
          <TabsContent value="activity">
            <Text className="text-sm text-muted">Recent events.</Text>
          </TabsContent>
          <TabsContent value="settings">
            <Text className="text-sm text-muted">Preferences.</Text>
          </TabsContent>
        </Tabs>
      </View>

      <View className="gap-2">
        <Label>Overflow</Label>
        <Tabs defaultValue="Overview" className="max-w-xs">
          <TabsList>
            {SECTIONS.map((section) => (
              <TabsTrigger key={section} value={section}>
                {section}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </View>

      <View className="gap-2">
        <Label>Segment</Label>
        <Tabs defaultValue="day" variant="segment">
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </View>

      <View className="gap-2">
        <Label>Underline</Label>
        <Tabs defaultValue="all" variant="underline">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </View>
    </View>
  );
}
