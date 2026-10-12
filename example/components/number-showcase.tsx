import { useState } from "react";
import { Text, View } from "react-native";
import { AnimatedNumber, Button, NumberTicker } from "../../src";
import { DemoSection } from "./demo";
import { useTicking } from "./use-ticking";

const addUsers = (value: number) => value + Math.floor(Math.random() * 50);

export function NumberShowcase() {
  const users = useTicking(addUsers, 48273, 2500);
  const [revenue, setRevenue] = useState(129480);

  return (
    <>
      <DemoSection
        title="Ticker"
        description="Each digit rolls through its own column. Updates every few seconds."
      >
        <View className="gap-1">
          <Text className="text-xs text-muted">Active users</Text>
          <NumberTicker
            value={users}
            locale
            className="text-4xl font-semibold text-foreground"
          />
        </View>
      </DemoSection>
      <DemoSection
        title="Count up"
        description="Counts from the previous value on an ease-out curve."
      >
        <View className="gap-1">
          <Text className="text-xs text-muted">Revenue</Text>
          <AnimatedNumber
            value={revenue}
            format={(value) => `$${Math.round(value).toLocaleString()}`}
            className="text-4xl font-semibold text-foreground"
          />
        </View>
        <Button
          size="sm"
          variant="secondary"
          onPress={() =>
            setRevenue((value) => value + Math.floor(Math.random() * 20000))
          }
        >
          Add revenue
        </Button>
      </DemoSection>
    </>
  );
}
