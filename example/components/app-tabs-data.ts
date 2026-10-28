// The showcase's tabs, shared by the native iOS bar and the floating Android
// bar so both list the same routes, labels and Hugeicons in the same order.
import DashboardSquare01 from "@hugeicons/core-free-icons/DashboardSquare01Icon";
import Layers01 from "@hugeicons/core-free-icons/Layers01Icon";
import Settings02 from "@hugeicons/core-free-icons/Settings02Icon";
import Sparkles from "@hugeicons/core-free-icons/SparklesIcon";
import type { IconSvgElement } from "@hugeicons/react-native";

export const TAB_ICONS = {
  all: DashboardSquare01,
  components: Layers01,
  agents: Sparkles,
  settings: Settings02,
} as const satisfies Record<string, IconSvgElement>;

export type TabIconName = keyof typeof TAB_ICONS;

export type AppTab = {
  /** Route folder under app/. */
  route: string;
  label: string;
  icon: TabIconName;
};

export const APP_TABS: AppTab[] = [
  { route: "(home)", label: "All", icon: "all" },
  { route: "components", label: "Components", icon: "components" },
  { route: "agents", label: "Agents", icon: "agents" },
  { route: "settings", label: "Settings", icon: "settings" },
];
