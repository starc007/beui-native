import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Platform, Text, View } from "react-native";
import { NumberTicker, RangeSlider } from "../../src";
import { DemoSection } from "./demo";

const haptics = Platform.OS !== "web";

// A light tick for every step the thumb lands on.
function tick() {
  if (haptics) void Haptics.selectionAsync();
}

function Readout({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-muted">{label}</Text>
      {children}
    </View>
  );
}

export function RangeSliderShowcase() {
  const [value, setValue] = useState(40);
  const [volume, setVolume] = useState(70);
  const [weight, setWeight] = useState(72.5);

  return (
    <>
      <DemoSection title="Steps">
        <View className="gap-3">
          <Readout label="Drag the handle">
            <NumberTicker
              value={value}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              className="text-sm font-medium text-foreground"
            />
          </Readout>
          <RangeSlider
            value={value}
            onValueChange={(next) => {
              setValue(next);
              tick();
            }}
            step={5}
            accessibilityLabel="Value"
          />
        </View>
      </DemoSection>

      <DemoSection title="Units">
        <View className="gap-6">
          <View className="gap-3">
            <Readout label="Volume">
              <Text className="text-sm font-medium text-foreground tabular-nums">
                {volume}%
              </Text>
            </Readout>
            <RangeSlider
              value={volume}
              onValueChange={(next) => {
                setVolume(next);
                tick();
              }}
              step={10}
              formatValueText={(next) => `${next}%`}
              accessibilityLabel="Volume"
            />
          </View>
          <View className="gap-3">
            <Readout label="Weight">
              <Text className="text-sm font-medium text-foreground tabular-nums">
                {weight.toFixed(1)} kg
              </Text>
            </Readout>
            <RangeSlider
              value={weight}
              onValueChange={(next) => {
                setWeight(next);
                tick();
              }}
              min={40}
              max={120}
              step={0.5}
              formatValueText={(next) => `${next} kilograms`}
              accessibilityLabel="Weight"
            />
          </View>
        </View>
      </DemoSection>

      <DemoSection title="Without ticks">
        <RangeSlider
          defaultValue={30}
          showTicks={false}
          accessibilityLabel="Brightness"
        />
      </DemoSection>

      <DemoSection title="Disabled">
        <RangeSlider
          defaultValue={60}
          step={20}
          disabled
          accessibilityLabel="Locked"
        />
      </DemoSection>
    </>
  );
}
