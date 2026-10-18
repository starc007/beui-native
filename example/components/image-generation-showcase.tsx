import { useEffect, useState } from "react";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { Button, ImageGeneration, type ImageGenerationStatus } from "../../src";
import { DemoSection, DemoStatus } from "./demo";

function Artwork() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#191b33" />
          <Stop offset="0.48" stopColor="#60538d" />
          <Stop offset="1" stopColor="#e59b7b" />
        </LinearGradient>
        <LinearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#314946" />
          <Stop offset="1" stopColor="#101817" />
        </LinearGradient>
        <RadialGradient id="glow">
          <Stop offset="0" stopColor="#ffe6b2" stopOpacity="0.95" />
          <Stop offset="1" stopColor="#efb47e" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="800" height="600" fill="url(#sky)" />
      <Circle cx="570" cy="210" r="150" fill="url(#glow)" />
      <Circle cx="570" cy="210" r="54" fill="#ffe5ad" />
      <Path
        d="M0 395 120 314l92 54 132-143 116 126 78-66 92 88 170-61v288H0Z"
        fill="#283d43"
        opacity={0.9}
      />
      <Path
        d="M0 432 118 376l99 73 115-97 107 92 112-52 108 68 141-48v188H0Z"
        fill="url(#ground)"
      />
      <Path
        d="M0 505c116-44 190-32 280 6 103 44 212 47 330-7 68-31 126-37 190-28v124H0Z"
        fill="#13201f"
      />
      <G fill="#c9d7c3" opacity={0.65}>
        <Circle cx="108" cy="142" r="2" />
        <Circle cx="168" cy="102" r="1.5" />
        <Circle cx="248" cy="154" r="2" />
        <Circle cx="332" cy="84" r="1.5" />
        <Circle cx="414" cy="138" r="2" />
      </G>
    </Svg>
  );
}

export function ImageGenerationShowcase() {
  const [run, setRun] = useState(0);
  const [status, setStatus] = useState<ImageGenerationStatus>("queued");
  const [note, setNote] = useState(
    "Drag across the placeholder while it generates.",
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` replays it
  useEffect(() => {
    setStatus("queued");
    const timers = [
      setTimeout(() => setStatus("generating"), 500),
      setTimeout(() => setStatus("refining"), 4000),
      setTimeout(() => setStatus("complete"), 6200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [run]);

  return (
    <DemoSection title="Generating">
      <DemoStatus>{note}</DemoStatus>
      <ImageGeneration
        prompt="a quiet mountain landscape at sunset"
        status={status}
        size="fluid"
        aspectRatio={4 / 3}
        resolution="1024 × 768"
        onLongPress={() =>
          setNote("Long-pressed the finished image, ready to save or share.")
        }
      >
        <Artwork />
      </ImageGeneration>
      <Button
        className="self-center"
        size="sm"
        variant="ghost"
        onPress={() => setRun((n) => n + 1)}
      >
        Replay
      </Button>
    </DemoSection>
  );
}
