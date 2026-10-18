import { useState } from "react";
import { View } from "react-native";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { VoiceOrb } from "../../src";
import { DemoSection, DemoStatus } from "./demo";

export function VoiceOrbShowcase() {
  const [listening, setListening] = useState(true);
  const level = useSharedValue(0);
  const time = useSharedValue(0);

  // Stands in for microphone metering: phrases with syllables inside them.
  useFrameCallback((frame) => {
    time.value += (frame.timeSincePreviousFrame ?? 16) / 1000;
    const t = time.value;
    const phrase = Math.max(0, Math.sin(t * 0.85));
    const syllable = Math.max(0, Math.sin(t * 9.3 + Math.sin(t * 2.1)));
    level.value = listening ? phrase * (0.12 + syllable ** 2 * 0.72) : 0;
  });

  return (
    <DemoSection
      title="Listening"
      description="The surface and silhouette follow the voice level. Tap the orb to pause and resume; the surface holds still where it is."
    >
      <DemoStatus>{listening ? "Listening." : "Paused."}</DemoStatus>
      <View className="items-center py-2">
        <VoiceOrb
          activity={level}
          active={listening}
          size={240}
          accessibilityLabel={listening ? "Stop listening" : "Start listening"}
          onPress={() => setListening((value) => !value)}
        />
      </View>
    </DemoSection>
  );
}
