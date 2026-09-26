import { View, type ViewProps } from "react-native";

export function Surface({ className = "", ...props }: ViewProps) {
  return (
    <View
      className={`rounded-2xl border border-border bg-surface p-5 ${className}`}
      {...props}
    />
  );
}
