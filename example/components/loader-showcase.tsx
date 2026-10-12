import { Text, View } from "react-native";
import { Loader, type LoaderVariant } from "../../src";
import { DemoSection } from "./demo";

const VARIANTS: { variant: LoaderVariant; label: string }[] = [
  { variant: "spinner", label: "Spinner" },
  { variant: "dots", label: "Dots" },
  { variant: "bars", label: "Bars" },
  { variant: "dot-matrix", label: "Dot matrix" },
  { variant: "dither", label: "Dither" },
  { variant: "morph", label: "Morph" },
  { variant: "comet", label: "Comet" },
  { variant: "metaballs", label: "Metaballs" },
  { variant: "newton", label: "Newton" },
  { variant: "helix", label: "Helix" },
  { variant: "scramble", label: "Scramble" },
  { variant: "percent", label: "Percent" },
  { variant: "ascii", label: "ASCII" },
  { variant: "ascii-line", label: "ASCII line" },
  { variant: "ascii-braille", label: "ASCII braille" },
  { variant: "ascii-blocks", label: "ASCII blocks" },
  { variant: "ascii-bounce", label: "ASCII bounce" },
];

export function LoaderShowcase() {
  return (
    <>
      <DemoSection title="Variants">
        <View className="flex-row flex-wrap gap-y-6">
          {VARIANTS.map(({ variant, label }) => (
            <View key={variant} className="w-1/3 items-center gap-3">
              <View className="h-14 items-center justify-center">
                <Loader variant={variant} size={32} label={label} />
              </View>
              <Text className="text-xs text-muted">{label}</Text>
            </View>
          ))}
        </View>
      </DemoSection>
      <DemoSection
        title="Size and color"
        description="Everything scales from one size."
      >
        <View className="flex-row items-center gap-6">
          <Loader variant="dots" size={16} />
          <Loader variant="dots" size={32} className="text-primary" />
          <Loader variant="dots" size={48} className="text-success" />
        </View>
      </DemoSection>
    </>
  );
}
