import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  AnimatedNumber,
  Button,
  ChromaticTextReveal,
  NumberTicker,
  Surface,
  TextCascade,
  TextReveal,
  TextScramble,
  TextShimmer,
} from "../../src";

const STATUSES = ["Deploying", "Building", "Shipped"];
const CODENAMES = ["NEBULA", "QUASAR", "PULSAR"];

function Header({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View className="gap-1">
      <Text
        accessibilityRole="header"
        className="text-lg font-semibold text-foreground"
      >
        {title}
      </Text>
      <Text className="text-sm leading-5 text-muted">{description}</Text>
    </View>
  );
}

function Caption({ children }: { children: string }) {
  return (
    <Text className="text-xs font-semibold uppercase tracking-wider text-muted">
      {children}
    </Text>
  );
}

function useTicking<T>(next: (value: T) => T, initial: T, every: number) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const timer = setInterval(() => setValue(next), every);
    return () => clearInterval(timer);
  }, [every, next]);
  return value;
}

const addUsers = (value: number) => value + Math.floor(Math.random() * 50);
const nextIndex = (value: number) => value + 1;

export function MotionTextShowcase() {
  const users = useTicking(addUsers, 48273, 2500);
  const tick = useTicking(nextIndex, 0, 2200);
  const [revenue, setRevenue] = useState(129480);
  const [revealKey, setRevealKey] = useState(0);
  const [codename, setCodename] = useState(0);

  return (
    <>
      <Surface className="gap-6">
        <Header
          title="Number animation"
          description="Count-ups and rolling tickers."
        />
        <View className="gap-2">
          <Caption>Ticker</Caption>
          <Text className="text-xs text-muted">Active users</Text>
          <NumberTicker
            value={users}
            locale
            className="text-3xl font-semibold text-foreground"
          />
        </View>
        <View className="gap-2">
          <Caption>Count up</Caption>
          <Text className="text-xs text-muted">Revenue</Text>
          <AnimatedNumber
            value={revenue}
            format={(value) => `$${Math.round(value).toLocaleString()}`}
            className="text-3xl font-semibold text-foreground"
          />
          <Button
            size="sm"
            variant="secondary"
            onPress={() =>
              setRevenue((value) => value + Math.floor(Math.random() * 20000))
            }
          >
            Add revenue
          </Button>
        </View>
      </Surface>

      <Surface className="gap-6">
        <Header
          title="Text animation"
          description="Reveals, sweeps, shimmers, cascades and scrambles."
        />
        <View className="gap-2">
          <Caption>Reveal</Caption>
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
        </View>
        <View className="gap-2">
          <Caption>Chromatic</Caption>
          <ChromaticTextReveal
            prefix="Motion that feels"
            words={["natural.", "intentional.", "alive."]}
            className="text-xl font-semibold text-foreground"
          />
        </View>
        <View className="gap-2">
          <Caption>Shimmer</Caption>
          <TextShimmer duration={1800} className="text-xl font-semibold">
            Loading with shimmer
          </TextShimmer>
        </View>
        <View className="gap-2">
          <Caption>Cascade</Caption>
          <TextCascade
            text={STATUSES[tick % STATUSES.length] ?? ""}
            className="text-xl font-semibold text-foreground"
          />
        </View>
        <View className="gap-2">
          <Caption>Scramble</Caption>
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
        </View>
      </Surface>
    </>
  );
}
