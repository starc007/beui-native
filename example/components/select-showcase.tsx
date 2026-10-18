import { useState } from "react";
import { Text, View } from "react-native";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../src";
import { DemoSection } from "./demo";

const TIMEZONES = [
  ["utc-8", "Los Angeles (UTC−8)"],
  ["utc-5", "New York (UTC−5)"],
  ["utc-3", "São Paulo (UTC−3)"],
  ["utc", "London (UTC)"],
  ["utc+1", "Berlin (UTC+1)"],
  ["utc+3", "Nairobi (UTC+3)"],
  ["utc+4", "Dubai (UTC+4)"],
  ["utc+5:30", "Mumbai (UTC+5:30)"],
  ["utc+8", "Singapore (UTC+8)"],
  ["utc+9", "Tokyo (UTC+9)"],
  ["utc+10", "Sydney (UTC+10)"],
  ["utc+12", "Auckland (UTC+12)"],
] as const;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <Text className="px-1 text-sm font-medium text-foreground">{label}</Text>
      {children}
    </View>
  );
}

export function SelectShowcase() {
  const [framework, setFramework] = useState("expo");
  const [zone, setZone] = useState<string>();

  return (
    <>
      <DemoSection title="Unfold">
        <Field label="Framework">
          <Select value={framework} onValueChange={setFramework}>
            <SelectTrigger accessibilityLabel="Framework">
              <SelectValue placeholder="Pick a framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expo">Expo</SelectItem>
              <SelectItem value="bare">React Native CLI</SelectItem>
              <SelectItem value="next">Next.js</SelectItem>
              <SelectItem value="astro">Astro</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </DemoSection>

      <DemoSection title="Long lists">
        <Field label="Time zone">
          <Select value={zone} onValueChange={setZone}>
            <SelectTrigger accessibilityLabel="Time zone">
              <SelectValue placeholder="Choose a time zone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </DemoSection>

      <DemoSection title="Disabled">
        <View className="gap-4">
          <Field label="Plan">
            <Select defaultValue="pro">
              <SelectTrigger accessibilityLabel="Plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="legacy" disabled>
                  Legacy (retired)
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Region">
            <Select defaultValue="eu" disabled>
              <SelectTrigger accessibilityLabel="Region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eu">Europe</SelectItem>
                <SelectItem value="us">United States</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </View>
      </DemoSection>
    </>
  );
}
