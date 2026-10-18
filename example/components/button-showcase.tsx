import { type ReactNode, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Button, type ButtonState, StatefulButton } from "../../src";
import { DemoSection, DemoStatus } from "./demo";
import { ArrowRightIcon, HeartIcon, PlusIcon } from "./icons";

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
    <View className="gap-8">
      <DemoStatus>{message}</DemoStatus>

      <DemoSection title="Spring press">
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
      </DemoSection>

      <DemoSection title="With icons">
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
      </DemoSection>

      <DemoSection title="Ripple">
        <Row>
          <Button ripple size="lg">
            Tap anywhere
          </Button>
          <Button ripple size="lg" variant="secondary">
            Or here
          </Button>
        </Row>
      </DemoSection>

      <DemoSection title="Stateful">
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
      </DemoSection>

      <DemoSection title="Quiet states">
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
      </DemoSection>
    </View>
  );
}
