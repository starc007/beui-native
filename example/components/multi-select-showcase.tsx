import { useState } from "react";
import { Text, View } from "react-native";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectEmpty,
  MultiSelectGroup,
  MultiSelectInput,
  MultiSelectItem,
  MultiSelectLabel,
  MultiSelectList,
  MultiSelectTrigger,
  MultiSelectValue,
} from "../../src";
import { DemoSection } from "./demo";

const TEAM_COLORS = {
  design: "bg-rose-500",
  engineering: "bg-sky-500",
  product: "bg-amber-500",
  research: "bg-violet-500",
  marketing: "bg-emerald-500",
  operations: "bg-slate-500",
} as const;

type Team = keyof typeof TEAM_COLORS;

function TeamOption({ value, children }: { value: Team; children: string }) {
  return (
    <MultiSelectItem value={value} textValue={children}>
      <View className="flex-row items-center gap-2.5">
        <View className={`size-2.5 rounded-full ${TEAM_COLORS[value]}`} />
        <Text className="text-sm text-foreground">{children}</Text>
      </View>
    </MultiSelectItem>
  );
}

const LANGUAGES = [
  { value: "ts", label: "TypeScript", keywords: ["javascript", "web"] },
  { value: "swift", label: "Swift", keywords: ["ios", "apple"] },
  { value: "kotlin", label: "Kotlin", keywords: ["android", "jvm"] },
  { value: "rust", label: "Rust", keywords: ["systems"] },
  { value: "go", label: "Go", keywords: ["golang", "server"] },
  { value: "python", label: "Python", keywords: ["data", "ml"] },
  { value: "ruby", label: "Ruby", keywords: ["rails"] },
  { value: "elixir", label: "Elixir", keywords: ["erlang", "phoenix"] },
];

export function MultiSelectShowcase() {
  const [languages, setLanguages] = useState<string[]>(["ts"]);

  return (
    <>
      <DemoSection title="Teams">
        <MultiSelect defaultValue={["design", "engineering"]}>
          <MultiSelectTrigger accessibilityLabel="Teams">
            <MultiSelectValue placeholder="Choose teams" />
          </MultiSelectTrigger>
          <MultiSelectContent>
            <MultiSelectInput accessibilityLabel="Search teams" />
            <MultiSelectList accessibilityLabel="Teams">
              <MultiSelectGroup>
                <MultiSelectLabel>Product teams</MultiSelectLabel>
                <TeamOption value="design">Design</TeamOption>
                <TeamOption value="engineering">Engineering</TeamOption>
                <TeamOption value="product">Product</TeamOption>
                <TeamOption value="research">Research</TeamOption>
              </MultiSelectGroup>
              <MultiSelectGroup>
                <MultiSelectLabel>Business teams</MultiSelectLabel>
                <TeamOption value="marketing">Marketing</TeamOption>
                <TeamOption value="operations">Operations</TeamOption>
              </MultiSelectGroup>
              <MultiSelectEmpty>No teams found.</MultiSelectEmpty>
            </MultiSelectList>
          </MultiSelectContent>
        </MultiSelect>
      </DemoSection>

      <DemoSection title="Search">
        <View className="gap-3">
          <MultiSelect value={languages} onValueChange={setLanguages}>
            <MultiSelectTrigger accessibilityLabel="Languages">
              <MultiSelectValue placeholder="Add languages" />
            </MultiSelectTrigger>
            <MultiSelectContent>
              <MultiSelectInput accessibilityLabel="Search languages" />
              <MultiSelectList accessibilityLabel="Languages">
                {LANGUAGES.map((language) => (
                  <MultiSelectItem
                    key={language.value}
                    value={language.value}
                    keywords={language.keywords}
                  >
                    {language.label}
                  </MultiSelectItem>
                ))}
                <MultiSelectEmpty>No languages match.</MultiSelectEmpty>
              </MultiSelectList>
            </MultiSelectContent>
          </MultiSelect>
          <Text className="text-sm text-muted">
            {languages.length === 0
              ? "Nothing picked yet."
              : `${languages.length} picked`}
          </Text>
        </View>
      </DemoSection>

      <DemoSection title="Disabled">
        <View className="gap-3">
          <MultiSelect defaultValue={["email"]}>
            <MultiSelectTrigger accessibilityLabel="Channels">
              <MultiSelectValue placeholder="Notify me by" />
            </MultiSelectTrigger>
            <MultiSelectContent>
              <MultiSelectInput accessibilityLabel="Search channels" />
              <MultiSelectList accessibilityLabel="Channels">
                <MultiSelectItem value="email">Email</MultiSelectItem>
                <MultiSelectItem value="push">Push</MultiSelectItem>
                <MultiSelectItem value="sms" disabled>
                  SMS (unavailable)
                </MultiSelectItem>
              </MultiSelectList>
            </MultiSelectContent>
          </MultiSelect>
          <MultiSelect defaultValue={["design"]} disabled>
            <MultiSelectTrigger accessibilityLabel="Teams">
              <MultiSelectValue />
            </MultiSelectTrigger>
            <MultiSelectContent>
              <MultiSelectList>
                <MultiSelectItem value="design">Design</MultiSelectItem>
              </MultiSelectList>
            </MultiSelectContent>
          </MultiSelect>
        </View>
      </DemoSection>
    </>
  );
}
