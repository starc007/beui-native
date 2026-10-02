import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

/** Reanimated supplies a synchronous initial value; native events keep it current. */
export function useReducedMotionPreference() {
  const initialValue = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(initialValue);

  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        receivedEvent = true;
        setReducedMotion(value);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active && !receivedEvent) setReducedMotion(value);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
