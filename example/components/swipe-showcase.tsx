import * as Haptics from "expo-haptics";
import { type ComponentType, useState } from "react";
import { Platform, Text, View } from "react-native";
import { useResolveClassNames } from "uniwind";
import {
  Button,
  type ButtonIconProps,
  type SwipeAction,
  SwipeableList,
  type SwipeableListItem,
} from "../../src";
import { DemoSection } from "./demo";
import {
  CheckIcon,
  ClockIcon,
  FileIcon,
  FlagIcon,
  MailIcon,
  PinIcon,
  TrashIcon,
  UserIcon,
} from "./icons";

// Outermost first on the left, outermost last on the right: those run on a full swipe.
const leftActions: SwipeAction[] = [
  { id: "done", label: "Done", icon: CheckIcon, tone: "success" },
  { id: "pin", label: "Pin", icon: PinIcon, tone: "primary" },
];

const rightActions: SwipeAction[] = [
  { id: "later", label: "Later", icon: ClockIcon, tone: "warning" },
  { id: "trash", label: "Trash", icon: TrashIcon, tone: "danger" },
];

function Leading({ icon: Icon }: { icon: ComponentType<ButtonIconProps> }) {
  const { color } = useResolveClassNames("text-muted");
  return (
    <View className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-background">
      <Icon size={18} color={color} />
    </View>
  );
}

const ROWS: [string, string, string, string, ComponentType<ButtonIconProps>][] =
  [
    [
      "brief",
      "Launch brief",
      "Finalize the announcement copy",
      "9:41",
      FileIcon,
    ],
    [
      "feedback",
      "Client feedback",
      "Three comments need a response",
      "11:08",
      MailIcon,
    ],
    [
      "review",
      "Design review",
      "Check spacing before handoff",
      "13:20",
      UserIcon,
    ],
    [
      "incident",
      "Flagged run",
      "Retry queue has one failed job",
      "Now",
      FlagIcon,
    ],
    ["invoice", "Invoice #2041", "Due Friday, $1,280", "Fri", FileIcon],
  ];

const initialItems: SwipeableListItem[] = ROWS.map(
  ([id, title, description, meta, icon]) => ({
    id,
    title,
    description,
    meta,
    leading: <Leading icon={icon} />,
    leftActions,
    rightActions,
  }),
);

// Haptics are native only; the web preview simply skips them.
const haptics = Platform.OS !== "web";

export function SwipeShowcase() {
  const [items, setItems] = useState(initialItems);
  const [status, setStatus] = useState(
    "Swipe either way. Keep going to run the outer action.",
  );

  return (
    <DemoSection>
      <View className="flex-row items-center justify-between gap-3">
        <View className="shrink gap-0.5">
          <Text className="text-sm font-semibold text-foreground">
            Priority queue
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            className="text-xs leading-4 text-muted"
          >
            {status}
          </Text>
        </View>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            setItems(initialItems);
            setStatus("Queue restored.");
          }}
        >
          Reset
        </Button>
      </View>
      <SwipeableList
        items={items}
        onItemPress={(item) => setStatus(`Opened ${item.title}`)}
        onSwipeThreshold={({ armed }) => {
          if (haptics && armed) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }}
        onAction={({ item, action, fullSwipe }) => {
          setStatus(
            `${action.label} · ${item.title}${fullSwipe ? " (full swipe)" : ""}`,
          );
          // Done and Trash clear the row; the list collapses it away.
          if (action.id === "trash" || action.id === "done") {
            if (haptics) {
              void Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            }
            setItems((current) => current.filter((row) => row.id !== item.id));
          }
        }}
      />
      <Text className="text-xs font-medium text-muted">
        {items.length} open
      </Text>
    </DemoSection>
  );
}
