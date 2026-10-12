import { type ComponentType, useState } from "react";
import { Text, View } from "react-native";
import { useResolveClassNames } from "uniwind";
import {
  Button,
  type ButtonIconProps,
  Surface,
  type SwipeAction,
  SwipeableList,
  type SwipeableListItem,
} from "../../src";
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
      <Icon size={16} color={color} />
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

export function SwipeShowcase() {
  const [items, setItems] = useState(initialItems);
  const [lastAction, setLastAction] = useState("Swipe a row either way.");

  return (
    <Surface className="gap-5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="shrink gap-1">
          <Text
            accessibilityRole="header"
            className="text-lg font-semibold text-foreground"
          >
            Swipeable list
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            className="text-sm leading-5 text-muted"
          >
            {lastAction}
          </Text>
        </View>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            setItems(initialItems);
            setLastAction("Queue restored.");
          }}
        >
          Reset
        </Button>
      </View>
      <SwipeableList
        items={items}
        onAction={({ item, action }) => {
          setLastAction(`${action.label} · ${item.title}`);
          if (action.id === "trash") {
            setItems((current) => current.filter((row) => row.id !== item.id));
          }
        }}
      />
      <Text className="text-xs font-medium text-muted">
        {items.length} open
      </Text>
    </Surface>
  );
}
