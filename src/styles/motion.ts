import { ReduceMotion } from "react-native-reanimated";

export const motion = {
  press: {
    duration: 120,
    reduceMotion: ReduceMotion.System,
  },
} as const;
