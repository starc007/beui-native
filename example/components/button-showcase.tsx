import { type ReactNode, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button, type ButtonState, StatefulButton, Surface } from "../../src";
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

function Row({ children }: { children: ReactNode }) {
  return (
    <View className="flex-row flex-wrap items-center gap-3">{children}</View>
  );
}

function useSequence() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      for (const timer of timers.current) clearTimeout(timer);
    },
    [],
  );
  return (steps: [number, () => void][]) => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = steps.map(([delay, step]) => setTimeout(step, delay));
  };
}

export function ButtonShowcase() {
  const [message, setMessage] = useState("Try any button below.");
  const [saved, setSaved] = useState(false);
  const [saveState, setSaveState] = useState<ButtonState>("idle");
  const [deployState, setDeployState] = useState<ButtonState>("idle");
  const run = useSequence();

  function save() {
    if (saveState !== "idle") return;
    setSaveState("loading");
    run([
      [1600, () => setSaveState("success")],
      [3200, () => setSaveState("idle")],
    ]);
  }

  function deploy() {
    if (deployState === "loading") return;
    setDeployState("loading");
    run([[1600, () => setDeployState("error")]]);
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
        title="Spring press"
        description="Four appearances that sink into the press and spring back."
      >
        <Row>
          <Button onPress={() => setMessage("Primary pressed.")}>
            Primary
          </Button>
          <Button
            variant="secondary"
            onPress={() => setMessage("Secondary pressed.")}
          >
            Secondary
          </Button>
          <Button
            variant="outline"
            onPress={() => setMessage("Outline pressed.")}
          >
            Outline
          </Button>
          <Button variant="ghost" onPress={() => setMessage("Ghost pressed.")}>
            Ghost
          </Button>
        </Row>
        <Row>
          <Button size="sm" variant="secondary">
            Small
          </Button>
          <Button size="md" variant="secondary">
            Medium
          </Button>
          <Button size="lg" variant="secondary">
            Large
          </Button>
        </Row>
      </Section>

      <Section
        title="With icons"
        description="Icons pick up the button's size and color."
      >
        <Row>
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
        </Row>
        <Row>
          <Button
            size="icon"
            variant="secondary"
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
            icon={HeartIcon}
          />
          <Button
            size="icon"
            variant="ghost"
            accessibilityLabel="Add item"
            onPress={() => setMessage("Add icon pressed.")}
            icon={PlusIcon}
          />
          <Button
            size="icon"
            variant="outline"
            accessibilityLabel="Go forward"
            onPress={() => setMessage("Forward icon pressed.")}
            icon={ArrowRightIcon}
          />
        </Row>
      </Section>

      <Section
        title="Ripple"
        description="A soft wave from wherever your finger lands."
      >
        <Row>
          <Button ripple size="lg">
            Tap anywhere
          </Button>
          <Button ripple size="lg" variant="secondary">
            Or here
          </Button>
        </Row>
      </Section>

      <Section
        title="Stateful"
        description="Labels roll letter by letter while the button resizes to fit."
      >
        <Row>
          <StatefulButton
            state={saveState}
            loadingText="Saving"
            successText="Saved"
            icon={ArrowRightIcon}
            onPress={save}
          >
            Save changes
          </StatefulButton>
          <StatefulButton
            variant="secondary"
            state={deployState}
            loadingText="Deploying"
            errorText="Try again"
            onPress={deploy}
          >
            Deploy
          </StatefulButton>
        </Row>
      </Section>

      <Section
        title="Quiet states"
        description="Disabled actions dim. Motion can be turned off per button."
      >
        <Row>
          <Button variant="secondary" disabled>
            Unavailable
          </Button>
          <Button
            variant="secondary"
            disableAnimation
            onPress={() => setMessage("Pressed without motion.")}
          >
            Without motion
          </Button>
        </Row>
      </Section>
    </View>
  );
}
