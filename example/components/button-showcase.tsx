import { type ReactNode, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button, Surface } from "../../src";
import { ArrowRightIcon, HeartIcon, PlusIcon } from "./icons";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Surface className="gap-5">
      <View className="gap-1">
        <Text
          accessibilityRole="header"
          className="text-lg font-semibold text-foreground"
        >
          {title}
        </Text>
        <Text className="text-sm leading-5 text-muted">{description}</Text>
      </View>
      {children}
    </Surface>
  );
}

export function ButtonShowcase() {
  const [message, setMessage] = useState("Try any button below.");
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function save() {
    if (timer.current) return;
    setLoading(true);
    setMessage("Saving changes…");
    timer.current = setTimeout(() => {
      setLoading(false);
      setMessage("Changes saved.");
      timer.current = null;
    }, 1800);
  }

  return (
    <View className="gap-4">
      <Text
        accessibilityLiveRegion="polite"
        className="text-sm leading-5 text-muted"
      >
        {message}
      </Text>
      <Section
        title="The essentials"
        description="Three appearances, one familiar action."
      >
        <View className="flex-row flex-wrap items-center gap-3">
          <Button onPress={() => setMessage("Primary pressed.")}>
            Primary
          </Button>
          <Button
            variant="secondary"
            onPress={() => setMessage("Secondary pressed.")}
          >
            Secondary
          </Button>
          <Button variant="ghost" onPress={() => setMessage("Ghost pressed.")}>
            Ghost
          </Button>
        </View>
        <View className="flex-row flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            onPress={() => setMessage("Small pressed.")}
          >
            Small
          </Button>
          <Button
            size="md"
            variant="secondary"
            onPress={() => setMessage("Medium pressed.")}
          >
            Medium
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onPress={() => setMessage("Large pressed.")}
          >
            Large
          </Button>
        </View>
      </Section>
      <Section
        title="A little direction"
        description="An icon before, after, or on both sides of the label."
      >
        <View className="flex-row flex-wrap items-center gap-3">
          <Button
            startIcon={PlusIcon}
            onPress={() => setMessage("Add item pressed.")}
          >
            Add item
          </Button>
          <Button
            variant="secondary"
            endIcon={ArrowRightIcon}
            onPress={() => setMessage("Continue pressed.")}
          >
            Continue
          </Button>
          <Button
            variant="secondary"
            startIcon={PlusIcon}
            endIcon={ArrowRightIcon}
            onPress={() => setMessage("Create project pressed.")}
          >
            Create project
          </Button>
        </View>
      </Section>
      <Section
        title="Just the icon"
        description="A compact shape with a full touch target."
      >
        <View className="flex-row flex-wrap items-center gap-3">
          <Button
            iconOnly
            icon={PlusIcon}
            accessibilityLabel="Add item"
            onPress={() => setMessage("Add icon pressed.")}
          />
          <Button
            iconOnly
            variant="secondary"
            size="sm"
            icon={HeartIcon}
            accessibilityLabel={
              saved ? "Remove from favorites" : "Save to favorites"
            }
            accessibilityState={{ selected: saved }}
            onPress={() => {
              setSaved(!saved);
              setMessage(
                saved ? "Removed from favorites." : "Saved to favorites.",
              );
            }}
          />
          <Button
            iconOnly
            variant="ghost"
            size="lg"
            icon={ArrowRightIcon}
            accessibilityLabel="Go forward"
            onPress={() => setMessage("Forward icon pressed.")}
          />
          <Button
            iconOnly
            variant="secondary"
            icon={PlusIcon}
            accessibilityLabel="Add unavailable"
            disabled
          />
          <Button
            iconOnly
            variant="secondary"
            icon={HeartIcon}
            accessibilityLabel="Saving favorite"
            loading
          />
        </View>
      </Section>
      <Section
        title="Every state"
        description="Loading keeps its footprint. Disabled actions stay quiet."
      >
        <View className="flex-row flex-wrap items-center gap-3">
          <Button
            startIcon={PlusIcon}
            endIcon={ArrowRightIcon}
            loading={loading}
            loadingLabel="Saving changes"
            disabled={disabled}
            onPress={save}
          >
            Save changes
          </Button>
          <Button
            variant="secondary"
            disabled
            onPress={() => setMessage("Unexpected disabled press.")}
          >
            Unavailable
          </Button>
        </View>
        <View className="flex-row flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            accessibilityState={{ selected: disabled }}
            onPress={() => setDisabled(!disabled)}
          >
            {disabled ? "Enable save button" : "Disable save button"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disableAnimation
            onPress={() => setMessage("Pressed without motion.")}
          >
            Without motion
          </Button>
        </View>
      </Section>
    </View>
  );
}
