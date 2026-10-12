import { Text } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../src";
import { DemoSection } from "./demo";

const SECTIONS = [
  "Overview",
  "Activity",
  "Analytics",
  "Members",
  "Billing",
  "Settings",
];

export function TabsShowcase() {
  return (
    // Tab lists use the surface color, so these sit on the page background.
    <>
      <DemoSection
        title="Pill"
        description="The default. Labels change color where the pill passes."
      >
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
      </DemoSection>

      <DemoSection
        title="Overflow"
        description="Wider lists scroll and reveal the selected tab."
      >
        <Tabs defaultValue="Overview" className="max-w-xs">
          <TabsList>
            {SECTIONS.map((section) => (
              <TabsTrigger key={section} value={section}>
                {section}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </DemoSection>

      <DemoSection title="Segment">
        <Tabs defaultValue="day" variant="segment">
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </DemoSection>

      <DemoSection title="Underline">
        <Tabs defaultValue="all" variant="underline">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </DemoSection>
    </>
  );
}
