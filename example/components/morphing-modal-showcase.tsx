import { type ComponentType, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { initialWindowMetrics } from "react-native-safe-area-context";
import { useResolveClassNames } from "uniwind";
import {
  Button,
  type IconProps,
  MorphingModal,
  MorphingModalHeader,
} from "../../src";
import { DemoSection, DemoStatus } from "./demo";
import {
  BlockIcon,
  FaceIdIcon,
  LockIcon,
  NoteIcon,
  ShieldIcon,
  TrashIcon,
} from "./icons";

type Step = "options" | "private-key" | "recovery" | "remove";

const WORDS = [
  "mountain",
  "river",
  "candle",
  "harbor",
  "amber",
  "violet",
  "spring",
  "ocean",
  "marble",
  "thunder",
  "willow",
  "crystal",
];

/** A big icon on a tinted circle, opening a detail view. */
function Badge({
  icon: Icon,
  destructive,
}: {
  icon: ComponentType<IconProps>;
  destructive?: boolean;
}) {
  const { color: foreground } = useResolveClassNames("text-foreground");
  const { color: danger } = useResolveClassNames("text-destructive");
  return (
    <View
      className={`mb-4 h-12 w-12 items-center justify-center rounded-full ${destructive ? "bg-destructive/10" : "bg-foreground/5"}`}
    >
      <Icon size={22} color={destructive ? danger : foreground} />
    </View>
  );
}

/** A row in the options view: icon, label, and a tint when it's destructive. */
function Row({
  icon: Icon,
  label,
  destructive,
  onPress,
}: {
  icon: ComponentType<IconProps>;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  const { color: foreground } = useResolveClassNames("text-foreground");
  const { color: danger } = useResolveClassNames("text-destructive");
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`min-h-14 flex-row items-center gap-3 rounded-2xl px-4 ${
        destructive
          ? "bg-destructive/10 active:bg-destructive/15"
          : "bg-foreground/5 active:bg-foreground/10"
      }`}
    >
      <Icon size={20} color={destructive ? danger : foreground} />
      <Text
        className={`text-base font-medium ${destructive ? "text-destructive" : "text-foreground"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Point({
  icon: Icon,
  children,
}: {
  icon: ComponentType<IconProps>;
  children: string;
}) {
  const { color: muted } = useResolveClassNames("text-muted");
  return (
    <View className="flex-row items-center gap-3">
      <Icon size={18} color={muted} />
      <Text className="flex-1 text-sm text-muted">{children}</Text>
    </View>
  );
}

export function MorphingModalShowcase() {
  const [view, setView] = useState<Step | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState("Open it, then pick a row.");
  const close = () => {
    setView(null);
    setRevealed(false);
  };
  const back = () => {
    setView("options");
    setRevealed(false);
  };

  return (
    <DemoSection title="Views">
      <DemoStatus>{status}</DemoStatus>
      <View className="min-h-48 items-center justify-center">
        <Button
          size="lg"
          className="self-center"
          onPress={() => setView("options")}
        >
          Open modal
        </Button>
      </View>

      <MorphingModal
        view={view}
        onClose={close}
        onBack={view && view !== "options" ? back : undefined}
        // The device's own inset: inside a tab screen, useSafeAreaInsets
        // also counts the tab bar, which the modal covers.
        bottomInset={initialWindowMetrics?.insets.bottom ?? 0}
        accessibilityLabel="Wallet options"
      >
        {view === "options" ? (
          <View>
            <MorphingModalHeader title="Options" />
            <View className="gap-2">
              <Row
                icon={LockIcon}
                label="View private key"
                onPress={() => setView("private-key")}
              />
              <Row
                icon={NoteIcon}
                label="View recovery phrase"
                onPress={() => setView("recovery")}
              />
              <Row
                icon={TrashIcon}
                label="Remove wallet"
                destructive
                onPress={() => setView("remove")}
              />
            </View>
          </View>
        ) : view === "private-key" ? (
          <View>
            <MorphingModalHeader onBack={back} />
            <Badge icon={LockIcon} />
            <Text className="text-2xl font-semibold text-foreground">
              Private key
            </Text>
            <Text className="mt-2 text-sm leading-5 text-muted">
              Your private key controls this wallet. Keep it secret and secure
              at all times.
            </Text>
            <View className="my-5 h-px bg-border" />
            {revealed ? (
              <Text
                selectable
                className="rounded-2xl bg-foreground/5 p-4 font-mono text-sm leading-5 text-foreground"
              >
                9f2c41e0b7a35d88c1f04a6e2b97d5303e8a1c6f47b2d09e5a18c7f3b64e2d1a
              </Text>
            ) : (
              <View className="gap-3">
                <Point icon={ShieldIcon}>Keep your private key safe</Point>
                <Point icon={BlockIcon}>Don't share it with anyone</Point>
                <Point icon={NoteIcon}>
                  If you lose it, we can't recover it
                </Point>
              </View>
            )}
            <View className="mt-6 flex-row gap-2">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onPress={back}
              >
                {revealed ? "Done" : "Cancel"}
              </Button>
              {revealed ? null : (
                <Button
                  size="lg"
                  className="flex-1"
                  startIcon={FaceIdIcon}
                  onPress={() => {
                    setRevealed(true);
                    setStatus("Revealed in place: the card grew to fit.");
                  }}
                >
                  Reveal
                </Button>
              )}
            </View>
          </View>
        ) : view === "recovery" ? (
          <View>
            <MorphingModalHeader onBack={back} />
            <Badge icon={NoteIcon} />
            <Text className="text-2xl font-semibold text-foreground">
              Recovery phrase
            </Text>
            <Text className="mt-2 text-sm leading-5 text-muted">
              12 words that restore your wallet on any device. Write them down
              somewhere safe.
            </Text>
            <View className="mt-5 flex-row flex-wrap gap-2">
              {WORDS.map((word, index) => (
                <View
                  key={word}
                  className="w-[31.5%] flex-row gap-1 rounded-xl bg-foreground/5 px-2.5 py-2"
                >
                  <Text className="text-xs text-muted">{index + 1}</Text>
                  <Text className="text-xs font-medium text-foreground">
                    {word}
                  </Text>
                </View>
              ))}
            </View>
            <Button size="lg" className="mt-6" onPress={back}>
              Done
            </Button>
          </View>
        ) : view === "remove" ? (
          <View>
            <MorphingModalHeader onBack={back} />
            <Badge icon={TrashIcon} destructive />
            <Text className="text-2xl font-semibold text-foreground">
              Remove this wallet?
            </Text>
            <Text className="mt-2 text-sm leading-5 text-muted">
              It leaves this device. You can add it back with its recovery
              phrase.
            </Text>
            <View className="mt-6 flex-row gap-2">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onPress={back}
              >
                Cancel
              </Button>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  close();
                  setStatus("Wallet removed. Not really: it's a demo.");
                }}
                className="min-h-12 flex-1 items-center justify-center rounded-full bg-destructive active:opacity-80"
              >
                <Text className="text-base font-medium text-on-primary">
                  Remove
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </MorphingModal>
    </DemoSection>
  );
}
