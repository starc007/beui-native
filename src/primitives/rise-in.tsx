import { type ReactNode, useEffect } from "react";
import type { ViewProps } from "react-native";
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { EASE_OUT, SPRING_LAYOUT } from "../styles/motion";

const FADE = { duration: 180, easing: EASE_OUT };
const RISE = 6;
const EXIT_DURATION = 140;

/** Leaving rows reverse their entrance: fade and lift 3 points away. */
function riseOut() {
  "worklet";
  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
    animations: {
      opacity: withTiming(0, { duration: EXIT_DURATION, easing: EASE_OUT }),
      transform: [
        {
          translateY: withTiming(-3, {
            duration: EXIT_DURATION,
            easing: EASE_OUT,
          }),
        },
      ],
    },
  };
}

const GLIDE = LinearTransition.springify()
  .stiffness(SPRING_LAYOUT.stiffness)
  .damping(SPRING_LAYOUT.damping)
  .mass(SPRING_LAYOUT.mass);

/**
 * A row that fades and rises 6 points into place when it mounts, and lifts
 * away as it leaves, while its neighbours glide to make room. Shared by the agent activity lists.
 */
export function RiseIn({
  reduce,
  appear = true,
  children,
  style,
  ...props
}: ViewProps & { reduce: boolean; appear?: boolean; children: ReactNode }) {
  const animate = appear && !reduce;
  const opacity = useSharedValue(animate ? 0 : 1);
  const lift = useSharedValue(animate ? RISE : 0);

  // Plays once, on mount.
  useEffect(() => {
    if (!animate) return;
    opacity.value = withTiming(1, FADE);
    lift.value = withSpring(0, SPRING_LAYOUT);
  }, []);

  const rise = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: lift.value }],
  }));

  return (
    <Animated.View
      layout={reduce ? undefined : GLIDE}
      exiting={reduce ? undefined : riseOut}
      style={[rise, style]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}
