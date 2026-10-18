import { useState } from "react";
import { Text, View } from "react-native";
import { useResolveClassNames } from "uniwind";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "../../src";
import { DemoSection, DemoStatus } from "./demo";
import { EditIcon, MoreIcon, PinIcon, ShareIcon, TrashIcon } from "./icons";

const SORTS = [
  { value: "recent", label: "Most recent" },
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
];

export function MenuShowcase() {
  const [note, setNote] = useState(
    "Tap the ⋯ button, or press and slide down the menu.",
  );
  const [pinned, setPinned] = useState(true);
  const [sort, setSort] = useState("recent");
  const { color: foreground } = useResolveClassNames("text-foreground");

  return (
    <DemoSection
      title="Actions"
      description="It springs out of its button. Slide a finger down the menu and the highlight follows; let go to choose."
    >
      <DemoStatus>{note}</DemoStatus>
      <View className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3">
        <View>
          <Text className="text-[15px] font-medium text-foreground">
            Launch plan
          </Text>
          <Text className="text-xs text-muted">Edited 2 hours ago</Text>
        </View>
        <Menu>
          <MenuTrigger accessibilityLabel="More actions">
            <View className="size-9 items-center justify-center rounded-full bg-background">
              <MoreIcon size={20} color={foreground} />
            </View>
          </MenuTrigger>
          <MenuContent align="end">
            <MenuItem icon={ShareIcon} onSelect={() => setNote("Share.")}>
              Share
            </MenuItem>
            <MenuItem icon={EditIcon} onSelect={() => setNote("Rename.")}>
              Rename
            </MenuItem>
            <MenuCheckboxItem
              icon={PinIcon}
              checked={pinned}
              onCheckedChange={(next) => {
                setPinned(next);
                setNote(next ? "Pinned." : "Unpinned.");
              }}
            >
              Pin to top
            </MenuCheckboxItem>
            <MenuSeparator />
            <MenuLabel>Sort by</MenuLabel>
            <MenuRadioGroup
              value={sort}
              onValueChange={(next) => {
                setSort(next);
                setNote(
                  `Sorted by ${SORTS.find((entry) => entry.value === next)?.label.toLowerCase()}.`,
                );
              }}
            >
              {SORTS.map((entry) => (
                <MenuRadioItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
            <MenuSeparator />
            <MenuItem
              icon={TrashIcon}
              destructive
              onSelect={() => setNote("Delete.")}
            >
              Delete
            </MenuItem>
          </MenuContent>
        </Menu>
      </View>
    </DemoSection>
  );
}
