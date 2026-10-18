import { useState } from "react";
import { Platform, Text, View } from "react-native";
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
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "../../src";
import { DemoSection, DemoStatus } from "./demo";
import {
  EditIcon,
  FolderIcon,
  FontIcon,
  MoreIcon,
  PinIcon,
  ShareIcon,
  TextSizeIcon,
  TrashIcon,
} from "./icons";

const SORTS = [
  { value: "recent", label: "Most recent" },
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
];

const FONTS = [
  { value: "sans", label: "Sans", family: undefined },
  {
    value: "serif",
    label: "Serif",
    family: Platform.select({ ios: "Georgia", default: "serif" }),
  },
  {
    value: "mono",
    label: "Mono",
    family: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
];
const SIZES = [
  { value: "small", label: "Small", size: 14, line: 21 },
  { value: "medium", label: "Medium", size: 16, line: 24 },
  { value: "large", label: "Large", size: 20, line: 29 },
];

function ActionsExample() {
  const [note, setNote] = useState(
    "Tap the ⋯ button, or press and slide down the menu.",
  );
  const [pinned, setPinned] = useState(true);
  const [sort, setSort] = useState("recent");
  const { color: foreground } = useResolveClassNames("text-foreground");

  return (
    <>
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
    </>
  );
}

/** A note whose text menu nests its options in submenus. */
function SubmenuExample() {
  const [font, setFont] = useState("serif");
  const [size, setSize] = useState("medium");
  const [folder, setFolder] = useState("Inbox");
  const { color: foreground } = useResolveClassNames("text-foreground");
  const activeFont = FONTS.find((entry) => entry.value === font);
  const activeSize = SIZES.find((entry) => entry.value === size);

  return (
    <View className="gap-3 rounded-2xl bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[15px] font-medium text-foreground">
            Launch notes
          </Text>
          <Text className="text-xs text-muted">In {folder}</Text>
        </View>
        <Menu>
          <MenuTrigger accessibilityLabel="Text options">
            <View className="size-9 items-center justify-center rounded-full bg-background">
              <FontIcon size={18} color={foreground} />
            </View>
          </MenuTrigger>
          <MenuContent align="end">
            <MenuSub>
              <MenuSubTrigger icon={FontIcon} description={activeFont?.label}>
                Font
              </MenuSubTrigger>
              <MenuSubContent>
                <MenuRadioGroup value={font} onValueChange={setFont}>
                  {FONTS.map((entry) => (
                    <MenuRadioItem key={entry.value} value={entry.value}>
                      {entry.label}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuSubContent>
            </MenuSub>
            <MenuSub>
              <MenuSubTrigger
                icon={TextSizeIcon}
                description={activeSize?.label}
              >
                Size
              </MenuSubTrigger>
              <MenuSubContent>
                <MenuRadioGroup value={size} onValueChange={setSize}>
                  {SIZES.map((entry) => (
                    <MenuRadioItem key={entry.value} value={entry.value}>
                      {entry.label}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuSubContent>
            </MenuSub>
            <MenuSeparator />
            <MenuSub>
              <MenuSubTrigger icon={FolderIcon} description={folder}>
                Move to
              </MenuSubTrigger>
              <MenuSubContent>
                <MenuItem onSelect={() => setFolder("Inbox")}>Inbox</MenuItem>
                <MenuItem onSelect={() => setFolder("Archive")}>
                  Archive
                </MenuItem>
                <MenuSub>
                  <MenuSubTrigger>Projects</MenuSubTrigger>
                  <MenuSubContent>
                    <MenuItem onSelect={() => setFolder("beUI Native")}>
                      beUI Native
                    </MenuItem>
                    <MenuItem onSelect={() => setFolder("Launch")}>
                      Launch
                    </MenuItem>
                  </MenuSubContent>
                </MenuSub>
              </MenuSubContent>
            </MenuSub>
          </MenuContent>
        </Menu>
      </View>
      <Text
        className="text-foreground"
        style={{
          fontFamily: activeFont?.family,
          fontSize: activeSize?.size,
          lineHeight: activeSize?.line,
        }}
      >
        Ship the agent components on Friday. Record the clips first, then sync
        the catalog to beui.dev.
      </Text>
    </View>
  );
}

export function MenuShowcase() {
  return (
    <>
      <DemoSection
        title="Actions"
        description="It springs out of its button. Slide a finger down the menu and the highlight follows; let go to choose."
      >
        <ActionsExample />
      </DemoSection>
      <DemoSection
        title="Submenus"
        description="Font, Size and Move to open in place, each showing its current choice, with a way back on top. Pick one and the note restyles; Projects nests one level deeper."
      >
        <SubmenuExample />
      </DemoSection>
    </>
  );
}
