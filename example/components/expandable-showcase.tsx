import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Platform, Text, View } from "react-native";
import Animated, {
  FadeIn,
  Keyframe,
  LayoutAnimationConfig,
  LinearTransition,
} from "react-native-reanimated";
import { ExpandableButton, ExpandableChip } from "../../src";
import { DemoSection } from "./demo";
import { BellIcon, BookmarkIcon, HeartIcon, ShareIcon } from "./icons";

const TOOLS = [
  { id: "like", icon: HeartIcon, label: "Like" },
  { id: "save", icon: BookmarkIcon, label: "Save for later" },
  { id: "share", icon: ShareIcon, label: "Share" },
] as const;

const TAGS = ["React", "Expo", "Reanimated", "TypeScript", "Uniwind"];

const haptics = Platform.OS !== "web";

// A light tick each time a control opens or folds.
function tick() {
  if (haptics) void Haptics.selectionAsync();
}

// A removed chip shrinks away while the rest glide into its place.
const CHIP_OUT = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  100: { opacity: 0, transform: [{ scale: 0.8 }] },
}).duration(180);
const CHIP_MOVE = LinearTransition.springify()
  .stiffness(320)
  .damping(26)
  .mass(0.8);

export function ExpandableShowcase() {
  const [tool, setTool] = useState<string | null>(null);
  const [tags, setTags] = useState(TAGS);

  return (
    <>
      <DemoSection title="Button">
        <ExpandableButton
          icon={BellIcon}
          label="Notifications"
          onExpandedChange={tick}
        />
      </DemoSection>

      <DemoSection title="Toolbar">
        <View className="flex-row flex-wrap gap-2">
          {TOOLS.map((item) => (
            <ExpandableButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              expanded={tool === item.id}
              onExpandedChange={(open) => {
                tick();
                setTool(open ? item.id : null);
              }}
            />
          ))}
        </View>
      </DemoSection>

      <DemoSection title="Chips">
        <View className="gap-3">
          <View className="flex-row flex-wrap gap-2">
            <LayoutAnimationConfig skipEntering>
              {tags.map((tag) => (
                <Animated.View
                  key={tag}
                  entering={FadeIn.duration(180)}
                  exiting={CHIP_OUT}
                  layout={CHIP_MOVE}
                >
                  <ExpandableChip
                    label={tag}
                    actionLabel={`Remove ${tag}`}
                    // It leaves the list instead of folding first.
                    collapseOnAction={false}
                    onExpandedChange={tick}
                    onAction={() => {
                      if (haptics) {
                        void Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light,
                        );
                      }
                      setTags((current) =>
                        current.filter((item) => item !== tag),
                      );
                    }}
                  />
                </Animated.View>
              ))}
            </LayoutAnimationConfig>
          </View>
          {tags.length < TAGS.length ? (
            <Text
              onPress={() => setTags(TAGS)}
              accessibilityRole="button"
              className="self-start py-2 text-sm font-medium text-primary"
            >
              Restore tags
            </Text>
          ) : null}
        </View>
      </DemoSection>

      <DemoSection title="Disabled">
        <View className="flex-row flex-wrap gap-2">
          <ExpandableButton icon={BellIcon} label="Notifications" disabled />
          <ExpandableChip label="Locked" actionLabel="Remove Locked" disabled />
        </View>
      </DemoSection>
    </>
  );
}
