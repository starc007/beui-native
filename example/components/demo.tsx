import type { ReactNode } from "react";
import { Text, View } from "react-native";

/** A section on a component page: an optional heading and note, then the demo. */
export function DemoSection({
  title,
  description,
  className = "",
  children,
}: {
  title?: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <View className={`gap-4 px-1 ${className}`}>
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
    </View>
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
