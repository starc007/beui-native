import { useState } from "react";
import { View } from "react-native";
import { Checkbox } from "../../src";
import { DemoSection } from "./demo";

const TOPPINGS = ["Cheese", "Olives", "Basil"] as const;

export function CheckboxShowcase() {
  const [terms, setTerms] = useState(true);
  const [toppings, setToppings] = useState<string[]>(["Cheese"]);
  const all = toppings.length === TOPPINGS.length;

  return (
    <>
      <DemoSection title="Basics">
        <View className="gap-4">
          <Checkbox
            checked={terms}
            onCheckedChange={setTerms}
            label="Accept terms and conditions"
          />
          <Checkbox
            label="Email me product updates"
            description="One message a month. Unsubscribe at any time."
          />
          <Checkbox defaultChecked disabled label="Disabled" />
        </View>
      </DemoSection>
      <DemoSection title="Select all">
        <View className="gap-4">
          <Checkbox
            checked={all}
            indeterminate={toppings.length > 0 && !all}
            onCheckedChange={() => setToppings(all ? [] : [...TOPPINGS])}
            label="All toppings"
          />
          <View className="gap-4 ps-8">
            {TOPPINGS.map((topping) => (
              <Checkbox
                key={topping}
                checked={toppings.includes(topping)}
                onCheckedChange={(checked) =>
                  setToppings((current) =>
                    checked
                      ? [...current, topping]
                      : current.filter((item) => item !== topping),
                  )
                }
                label={topping}
              />
            ))}
          </View>
        </View>
      </DemoSection>
    </>
  );
}
