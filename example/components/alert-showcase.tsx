import { useState } from "react";
import { View } from "react-native";
import {
  Alert,
  AlertAction,
  AlertClose,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
} from "../../src";
import { DemoSection } from "./demo";

const MESSAGES = {
  info: {
    label: "Info",
    title: "A little heads up",
    description: "Your changes are saved automatically as you work.",
  },
  success: {
    label: "Success",
    title: "All set",
    description: "Your changes have been saved.",
  },
  warning: {
    label: "Warning",
    title: "Almost at the limit",
    description:
      "You're getting close to your storage limit. Free up some space before uploading more files.",
  },
  destructive: {
    label: "Error",
    title: "Something went wrong",
    description: "We couldn't save your changes. Give it another try.",
  },
} as const;

type Variant = keyof typeof MESSAGES;

const STACK = [
  {
    id: "update",
    variant: "info",
    title: "Update available",
    description: "Version 2.4 is ready to install.",
  },
  {
    id: "backup",
    variant: "success",
    title: "Backup complete",
    description: "All 1,284 photos are safe.",
  },
  {
    id: "card",
    variant: "warning",
    title: "Card expires soon",
    description: "Update your payment method before May.",
  },
] as const;

export function AlertShowcase() {
  const [variant, setVariant] = useState<Variant>("info");
  const [open, setOpen] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const message = MESSAGES[variant];

  return (
    <>
      <DemoSection title="Variants">
        <View className="gap-4">
          <Tabs
            value={variant}
            onValueChange={(next) => {
              setVariant(next as Variant);
              setOpen(true);
            }}
            variant="segment"
          >
            <TabsList accessibilityLabel="Alert variant">
              {Object.entries(MESSAGES).map(([value, item]) => (
                <TabsTrigger key={value} value={value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Alert variant={variant} open={open} onOpenChange={setOpen}>
            <AlertIcon />
            <AlertContent>
              <AlertTitle>{message.title}</AlertTitle>
              <AlertDescription>{message.description}</AlertDescription>
              {variant === "destructive" ? (
                <AlertAction>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => setVariant("success")}
                  >
                    Try again
                  </Button>
                </AlertAction>
              ) : null}
            </AlertContent>
            <AlertClose />
          </Alert>
          <Button
            className="self-center"
            variant="ghost"
            size="sm"
            disabled={open}
            onPress={() => setOpen(true)}
          >
            Show alert
          </Button>
        </View>
      </DemoSection>

      <DemoSection title="Stacked">
        <View className="gap-3">
          {STACK.map((item) => (
            <Alert
              key={item.id}
              variant={item.variant}
              open={!dismissed.includes(item.id)}
              onOpenChange={(next) => {
                if (!next) setDismissed((current) => [...current, item.id]);
              }}
            >
              <AlertIcon />
              <AlertContent>
                <AlertTitle>{item.title}</AlertTitle>
                <AlertDescription>{item.description}</AlertDescription>
              </AlertContent>
              <AlertClose />
            </Alert>
          ))}
          <Button
            className="self-center"
            variant="ghost"
            size="sm"
            disabled={dismissed.length === 0}
            onPress={() => setDismissed([])}
          >
            Restore all
          </Button>
        </View>
      </DemoSection>

      <DemoSection title="Plain">
        <Alert>
          <AlertIcon />
          <AlertContent>
            <AlertTitle>Scheduled maintenance</AlertTitle>
            <AlertDescription>
              Sync pauses on Sunday from 2 to 3 AM.
            </AlertDescription>
          </AlertContent>
        </Alert>
      </DemoSection>
    </>
  );
}
