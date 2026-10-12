import { Text, View } from "react-native";
import { Loader, type LoaderVariant, Surface } from "../../src";

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
    <Surface className="gap-5">
      <View className="gap-1">
        <Text
          accessibilityRole="header"
          className="text-lg font-semibold text-foreground"
        >
          Loader
        </Text>
        <Text className="text-sm leading-5 text-muted">
          Seventeen indicators that all scale from one size.
        </Text>
      </View>
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
    </Surface>
  );
}
