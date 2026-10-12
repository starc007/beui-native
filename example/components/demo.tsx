import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Surface } from "../../src";

/** A card on a component page, with an optional heading and note. */
export function DemoSection({
  title,
  description,
  className = "",
  plain = false,
  children,
}: {
  title?: string;
  description?: string;
  className?: string;
  /** Drops the card, for components whose own surface would blend into it. */
  plain?: boolean;
  children: ReactNode;
}) {
  const Container = plain ? View : Surface;
  return (
    <Container className={`gap-5 ${plain ? "px-1" : ""} ${className}`}>
      {title || description ? (
        <View className="gap-1">
          {title ? (
            <Text
              accessibilityRole="header"
              className="text-base font-semibold text-foreground"
            >
              {title}
            </Text>
          ) : null}
          {description ? (
            <Text className="text-sm leading-5 text-muted">{description}</Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </Container>
  );
}

/** A live status line above a demo, announced politely to screen readers. */
export function DemoStatus({ children }: { children: string }) {
  return (
    <Text
      accessibilityLiveRegion="polite"
      className="px-1 text-sm leading-5 text-muted"
    >
      {children}
    </Text>
  );
}
