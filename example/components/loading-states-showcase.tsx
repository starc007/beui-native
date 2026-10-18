import { View } from "react-native";
import { AgentProgress, ReasoningText, ThinkingShimmer } from "../../src";
import { DemoSection } from "./demo";

export function LoadingStatesShowcase() {
  return (
    <>
      <DemoSection title="Thinking shimmer">
        <ThinkingShimmer className="text-lg">Thinking…</ThinkingShimmer>
      </DemoSection>
      <DemoSection title="Reasoning text">
        <View className="gap-4">
          <ReasoningText variant="cascade" className="text-base" />
          <ReasoningText variant="swap" className="text-base" />
          <ReasoningText
            variant="scramble"
            className="text-base"
            phrases={["Thinking", "Searching", "Reasoning", "Composing"]}
          />
        </View>
      </DemoSection>
      <DemoSection title="Agent progress">
        <AgentProgress
          label="Churning"
          initialSeconds={151.6}
          className="text-base"
        />
      </DemoSection>
    </>
  );
}
