import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Button, Citation, type CitationItem, Citations } from "../../src";
import { DemoSection } from "./demo";
import { FileIcon } from "./icons";

const SOURCES: CitationItem[] = [
  {
    id: "reanimated",
    title: "Reanimated documentation",
    domain: "docs.swmansion.com",
    url: "https://docs.swmansion.com/react-native-reanimated/",
  },
  {
    id: "wai",
    title: "WAI accessibility patterns",
    domain: "w3.org",
    url: "https://www.w3.org/WAI/ARIA/apg/",
  },
  {
    id: "guidelines",
    title: "Motion guidelines",
    domain: "Design handbook · PDF",
    icon: <FileIcon size={14} color="gray" />,
  },
];

export function CitationsShowcase() {
  const [run, setRun] = useState(0);
  const [visible, setVisible] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` replays the sources
  useEffect(() => {
    setVisible(0);
    const timers = SOURCES.map((_, index) =>
      setTimeout(() => setVisible(index + 1), 500 + index * 700),
    );
    return () => timers.forEach(clearTimeout);
  }, [run]);

  return (
    <>
      <DemoSection title="Inline citations">
        <Text className="text-sm leading-7 text-foreground">
          Run gesture-driven motion on the UI thread{" "}
          <Citation item={SOURCES[0] as CitationItem} index={1} /> and keep
          every control reachable by screen readers{" "}
          <Citation item={SOURCES[1] as CitationItem} index={2} />, keeping
          exits shorter than entrances{" "}
          <Citation item={SOURCES[2] as CitationItem} index={3} />.
        </Text>
      </DemoSection>
      <DemoSection title="Sources">
        <View>
          <Citations citations={SOURCES.slice(0, visible)} defaultOpen />
        </View>
        <Button
          className="self-center"
          size="sm"
          variant="ghost"
          onPress={() => setRun((n) => n + 1)}
        >
          Replay
        </Button>
      </DemoSection>
    </>
  );
}
