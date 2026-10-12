import { useState } from "react";
import { View } from "react-native";
import { Switch } from "../../src";
import { DemoSection } from "./demo";

export function SwitchShowcase() {
  const [notifications, setNotifications] = useState(true);

  return (
    <>
      <DemoSection
        title="States"
        description="Controlled, uncontrolled and disabled."
      >
        <View className="gap-4">
          <Switch
            checked={notifications}
            onCheckedChange={setNotifications}
            label="Enable notifications"
          />
          <Switch label="Uncontrolled, starts off" />
          <Switch defaultChecked disabled label="Disabled (press to shake)" />
          <Switch disabled label="Disabled and off" />
        </View>
      </DemoSection>
      <DemoSection
        title="Without a label"
        description="Screen readers still hear a name through accessibilityLabel."
      >
        <Switch accessibilityLabel="Airplane mode" />
      </DemoSection>
    </>
  );
}
