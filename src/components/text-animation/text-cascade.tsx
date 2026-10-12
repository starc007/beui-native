import { View, type ViewProps } from "react-native";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { CascadeText } from "../../primitives/cascade-text";

export type TextCascadeProps = Omit<ViewProps, "children"> & {
  /** Current text. Changing it cascades the letters to the new value. */
  text: string;
  /** Text style for every letter. */
  className?: string;
  /** Disables the cascade independently of the system preference. */
  disableAnimation?: boolean;
};

/**
 * Letter-by-letter slot roll for standalone text: old letters roll away as
 * new ones land, left to right. The same motion as StatefulButton's labels.
 */
export function TextCascade({
  text,
  className = "",
  disableAnimation = false,
  accessibilityLabel,
  ...props
}: TextCascadeProps) {
  const reducedMotion = useReducedMotionPreference();

  return (
    <View
      {...props}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? text}
      style={[{ alignSelf: "flex-start" }, props.style]}
    >
      <CascadeText
        textKey={text}
        text={text}
        className={className}
        reduce={reducedMotion || disableAnimation}
      />
    </View>
  );
}
