import { Tabs } from "expo-router/js-tabs";
import { NativeTabs } from "expo-router/native-tabs";
import { useResolveClassNames } from "uniwind";
import { APP_TABS, type TabIconName } from "./app-tabs-data";
import { FloatingTabBar } from "./floating-tab-bar";
import { hugeiconsTabFamily } from "./tab-icons";

/**
 * A trigger's Hugeicon, tinted by the native bar. A function, not a
 * component: NativeTabs finds a trigger's icon by its element type.
 */
const tabIcon = (name: TabIconName) => (
  <NativeTabs.Trigger.Icon
    src={
      <NativeTabs.Trigger.VectorIcon family={hugeiconsTabFamily} name={name} />
    }
    renderingMode="template"
  />
);

/** iOS: the system tab bar, with its Liquid Glass and minimize behaviour. */
export function NativeAppTabs({ hidden }: { hidden: boolean }) {
  const { color: primary } = useResolveClassNames("text-primary");
  const { backgroundColor: surface } = useResolveClassNames("bg-background");

  return (
    // Solid at the edge too: the lists start with a header, not a scroll
    // view, so the tab bar can't tell when they reach the bottom.
    <NativeTabs
      hidden={hidden}
      tintColor={primary as string}
      backgroundColor={surface as string}
      disableTransparentOnScrollEdge
    >
      {APP_TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.route} name={tab.route}>
          {tabIcon(tab.icon)}
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}

/** Android: the floating bar in place of the flat Material one. */
export function FloatingAppTabs({ hidden }: { hidden: boolean }) {
  const { backgroundColor: background } = useResolveClassNames("bg-background");

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} hidden={hidden} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: background as string },
      }}
    >
      {APP_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.route}
          name={tab.route}
          options={{ title: tab.label }}
        />
      ))}
    </Tabs>
  );
}
