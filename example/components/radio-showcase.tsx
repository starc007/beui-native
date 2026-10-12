import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "../../src";
import { DemoSection } from "./demo";

export function RadioShowcase() {
  const [plan, setPlan] = useState("pro");

  return (
    <>
      <DemoSection
        title="Vertical"
        description="With descriptions and a disabled option."
      >
        <RadioGroup value={plan} onValueChange={setPlan}>
          <RadioGroupItem value="starter" label="Starter, free" />
          <RadioGroupItem
            value="pro"
            label="Pro, $12/mo"
            description="Unlimited projects and priority support."
          />
          <RadioGroupItem value="team" label="Team, $29/mo" />
          <RadioGroupItem value="legacy" label="Legacy plan" disabled />
        </RadioGroup>
      </DemoSection>
      <DemoSection title="Horizontal">
        <RadioGroup defaultValue="md" orientation="horizontal">
          <RadioGroupItem value="sm" label="Small" />
          <RadioGroupItem value="md" label="Medium" />
          <RadioGroupItem value="lg" label="Large" />
        </RadioGroup>
      </DemoSection>
    </>
  );
}
