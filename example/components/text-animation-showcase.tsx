import { useState } from "react";
import {
  Button,
  ChromaticTextReveal,
  TextCascade,
  TextReveal,
  TextScramble,
  TextShimmer,
} from "../../src";
import { DemoSection } from "./demo";
import { useTicking } from "./use-ticking";

const STATUSES = ["Deploying", "Building", "Shipped"];
const CODENAMES = ["NEBULA", "QUASAR", "PULSAR"];
const nextIndex = (value: number) => value + 1;

export function TextAnimationShowcase() {
  const tick = useTicking(nextIndex, 0, 2200);
  const [revealKey, setRevealKey] = useState(0);
  const [codename, setCodename] = useState(0);

  return (
    <>
      <DemoSection
        title="Reveal"
        description="Words rise into place on a soft spring."
      >
        <TextReveal
          key={revealKey}
          text="Motion in words."
          stagger={45}
          yOffset="18%"
          accessibilityRole="header"
          className="text-3xl font-semibold text-foreground"
        />
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setRevealKey((key) => key + 1)}
        >
          Replay
        </Button>
      </DemoSection>
      <DemoSection
        title="Chromatic"
        description="A color sweep reveals each word, then moves on."
      >
        <ChromaticTextReveal
          prefix="Motion that feels"
          words={["natural.", "intentional.", "alive."]}
          className="text-xl font-semibold text-foreground"
        />
      </DemoSection>
      <DemoSection
        title="Shimmer"
        description="For loading and thinking states."
      >
        <TextShimmer duration={1800} className="text-xl font-semibold">
          Loading with shimmer
        </TextShimmer>
      </DemoSection>
      <DemoSection
        title="Cascade"
        description="Letters roll to the next status, left to right."
      >
        <TextCascade
          text={STATUSES[tick % STATUSES.length] ?? ""}
          className="text-xl font-semibold text-foreground"
        />
      </DemoSection>
      <DemoSection
        title="Scramble"
        description="Characters cycle through glyphs before settling."
      >
        <TextScramble
          text={CODENAMES[codename % CODENAMES.length] ?? ""}
          className="text-xl font-semibold text-foreground"
        />
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setCodename((index) => index + 1)}
        >
          Scramble
        </Button>
      </DemoSection>
    </>
  );
}
