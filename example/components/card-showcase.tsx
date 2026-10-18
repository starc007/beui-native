import { useState } from "react";
import { Image, Text, View } from "react-native";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Switch,
} from "../../src";
import { DemoSection } from "./demo";

const DOCUMENTS = [
  {
    id: "contract",
    title: "Signed contract",
    description: "The final PDF with every signature and the audit trail.",
  },
  {
    id: "invoice",
    title: "Invoice",
    description: "Itemised billing for the period, ready for accounting.",
  },
];

const SUMMARY = [
  { label: "Plan", value: "Team, yearly" },
  { label: "Seats", value: "12" },
  { label: "Billing email", value: "billing@acme.co" },
];

function DocumentChoice({
  title,
  description,
  initial,
}: {
  title: string;
  description: string;
  initial: boolean;
}) {
  const [checked, setChecked] = useState(initial);
  return (
    // The card owns the choice; the checkbox inside only shows it.
    <Card
      size="compact"
      selected={checked}
      onPress={() => setChecked(!checked)}
      accessibilityRole="checkbox"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ checked }}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction
          style={{ pointerEvents: "none" }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Checkbox checked={checked} accessibilityLabel={title} />
        </CardAction>
      </CardHeader>
    </Card>
  );
}

export function CardShowcase() {
  const [mentions, setMentions] = useState(true);
  const [digest, setDigest] = useState(false);

  return (
    <>
      <DemoSection title="Selectable">
        <View className="gap-3">
          {DOCUMENTS.map((document, index) => (
            <DocumentChoice
              key={document.id}
              title={document.title}
              description={document.description}
              initial={index === 0}
            />
          ))}
        </View>
      </DemoSection>

      <DemoSection title="Muted">
        <Card variant="muted" size="compact">
          <CardHeader>
            <CardTitle heading>Notifications</CardTitle>
            <CardDescription>Choose what reaches your inbox.</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="flex-row items-center justify-between gap-4">
              <Text className="text-sm text-foreground">
                Mentions and replies
              </Text>
              <Switch
                checked={mentions}
                onCheckedChange={setMentions}
                accessibilityLabel="Mentions and replies"
              />
            </View>
            <View className="flex-row items-center justify-between gap-4">
              <Text className="text-sm text-foreground">Weekly digest</Text>
              <Switch
                checked={digest}
                onCheckedChange={setDigest}
                accessibilityLabel="Weekly digest"
              />
            </View>
          </CardContent>
        </Card>
      </DemoSection>

      <DemoSection title="Header action and footer">
        <Card>
          <CardHeader>
            <CardTitle heading>Review order</CardTitle>
            <CardDescription>
              Check the details before you confirm.
            </CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {SUMMARY.map((row, index) => (
              <View
                key={row.label}
                className={`flex-row items-center justify-between gap-4 py-2.5 ${index > 0 ? "border-t border-border" : "pt-0"} ${index === SUMMARY.length - 1 ? "pb-0" : ""}`}
              >
                <Text className="text-sm text-muted">{row.label}</Text>
                <Text className="text-sm font-medium text-foreground">
                  {row.value}
                </Text>
              </View>
            ))}
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="secondary" size="sm">
              Back
            </Button>
            <Button size="sm">Confirm order</Button>
          </CardFooter>
        </Card>
      </DemoSection>

      <DemoSection title="With media">
        <Card className="overflow-hidden pt-0">
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=720&q=80",
            }}
            accessibilityLabel="Bright open-plan studio with long desks and plants"
            style={{ width: "100%", aspectRatio: 16 / 9 }}
          />
          <CardHeader>
            <CardTitle heading>Studio, Lisbon</CardTitle>
            <CardDescription>
              Desks for 12 people, booked for the March offsite.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-between">
            <Text className="text-sm text-muted">
              <Text className="font-medium text-foreground">€1,840</Text> · 3
              days
            </Text>
            <Button variant="secondary" size="sm">
              View booking
            </Button>
          </CardFooter>
        </Card>
      </DemoSection>
    </>
  );
}
