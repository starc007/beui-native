import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerArea,
  ColorPickerChannels,
  ColorPickerContent,
  ColorPickerHexInput,
  ColorPickerHue,
  ColorPickerPreset,
  ColorPickerPresets,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from "../../src";
import { DemoSection } from "./demo";

const FORMATS = ["hex", "rgb", "hsl"] as const;
type Format = (typeof FORMATS)[number];

const PRESETS = [
  { value: "#3478f6", label: "Blue" },
  { value: "#9270e8", label: "Purple" },
  { value: "#e66aa4", label: "Pink" },
  { value: "#e55656", label: "Red" },
  { value: "#ed9141", label: "Orange" },
  { value: "#e5b63c", label: "Amber" },
  { value: "#65a65a", label: "Green" },
  { value: "#169d83", label: "Teal" },
];

const haptics = Platform.OS !== "web";

// A light tick when a change settles: a drag ends, a preset lands.
function tick() {
  if (haptics) void Haptics.selectionAsync();
}

function FormatFields() {
  const [format, setFormat] = useState<Format>("hex");
  const next = FORMATS[(FORMATS.indexOf(format) + 1) % FORMATS.length] ?? "hex";
  return (
    <View className="flex-row items-start gap-1.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Format ${format.toUpperCase()}, switch to ${next.toUpperCase()}`}
        onPress={() => setFormat(next)}
        className="h-9 w-12 items-center justify-center rounded-lg border border-border bg-background active:opacity-70"
      >
        <Text className="text-xs font-medium text-muted">
          {format.toUpperCase()}
        </Text>
      </Pressable>
      {format === "hex" ? (
        <>
          <ColorPickerHexInput />
          <ColorPickerSwatch />
        </>
      ) : (
        <ColorPickerChannels format={format} />
      )}
    </View>
  );
}

export function ColorPickerShowcase() {
  const [brand, setBrand] = useState("#3478f6");
  const [accent, setAccent] = useState("#e66aa4");

  return (
    <>
      <DemoSection title="Popover">
        <View className="gap-3">
          <ColorPicker
            value={brand}
            onValueChange={setBrand}
            onValueCommit={tick}
          >
            <ColorPickerTrigger accessibilityLabel={`Brand color, ${brand}`} />
            <ColorPickerContent accessibilityLabel="Brand color">
              <ColorPickerArea />
              <View className="gap-3 py-1">
                <ColorPickerHue />
                <ColorPickerAlpha />
              </View>
              <FormatFields />
              <ColorPickerPresets
                accessibilityLabel="Presets"
                className="justify-between px-0.5 pt-1"
              >
                {PRESETS.map((preset) => (
                  <ColorPickerPreset
                    key={preset.value}
                    value={preset.value}
                    label={preset.label}
                  />
                ))}
              </ColorPickerPresets>
            </ColorPickerContent>
          </ColorPicker>
          <View className="flex-row items-center gap-2">
            <View
              className="size-4 rounded-full"
              style={{ backgroundColor: brand }}
            />
            <Text className="text-sm text-muted">
              Brand color{" "}
              <Text className="font-mono text-foreground">{brand}</Text>
            </Text>
          </View>
        </View>
      </DemoSection>

      <DemoSection title="Inline">
        <ColorPicker
          value={accent}
          onValueChange={setAccent}
          onValueCommit={tick}
          alpha={false}
        >
          <View className="gap-4">
            <ColorPickerArea />
            <ColorPickerHue />
            <View className="flex-row items-center gap-2">
              <ColorPickerHexInput />
              <ColorPickerSwatch />
            </View>
          </View>
        </ColorPicker>
      </DemoSection>
    </>
  );
}
