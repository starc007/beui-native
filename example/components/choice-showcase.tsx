import { useState } from "react";
import { Text, View } from "react-native";
import { Checkbox, RadioGroup, RadioGroupItem, Surface } from "../../src";

const TOPPINGS = ["Cheese", "Olives", "Basil"] as const;

export function ChoiceShowcase() {
  const [terms, setTerms] = useState(true);
  const [toppings, setToppings] = useState<string[]>(["Cheese"]);
  const [plan, setPlan] = useState("pro");
  const all = toppings.length === TOPPINGS.length;

  return (
    <>
      <Surface className="gap-5">
        <View className="gap-1">
          <Text
            accessibilityRole="header"
            className="text-lg font-semibold text-foreground"
          >
            Checkbox
          </Text>
          <Text className="text-sm leading-5 text-muted">
            The checkmark draws itself in. A partial selection shows a dash.
          </Text>
        </View>
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
          <Checkbox defaultChecked disabled label="Disabled" />
        </View>
      </Surface>

      <Surface className="gap-5">
        <View className="gap-1">
          <Text
            accessibilityRole="header"
            className="text-lg font-semibold text-foreground"
          >
            Radio group
          </Text>
          <Text className="text-sm leading-5 text-muted">
            One dot glides to the option you pick.
          </Text>
        </View>
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
        <RadioGroup defaultValue="md" orientation="horizontal">
          <RadioGroupItem value="sm" label="Small" />
          <RadioGroupItem value="md" label="Medium" />
          <RadioGroupItem value="lg" label="Large" />
        </RadioGroup>
      </Surface>
    </>
  );
}
