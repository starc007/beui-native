import { useState } from "react";
import { Text, View } from "react-native";
import { Surface, Switch } from "../../src";

export function SwitchShowcase() {
  const [notifications, setNotifications] = useState(true);

  return (
    <Surface className="gap-5">
      <View className="gap-1">
        <Text
          accessibilityRole="header"
          className="text-lg font-semibold text-foreground"
        >
          Switch
        </Text>
        <Text className="text-sm leading-5 text-muted">
          A weighty thumb that squishes under your finger and stretches toward
          where it is going.
        </Text>
      </View>
      <View className="gap-4">
        <Switch
          checked={notifications}
          onCheckedChange={setNotifications}
          label="Enable notifications"
        />
        <Switch label="Uncontrolled, starts off" />
        <Switch defaultChecked disabled label="Disabled (press to shake)" />
        <Switch disabled label="Disabled and off" />
        <Switch accessibilityLabel="Airplane mode" />
      </View>
    </Surface>
  );
}
