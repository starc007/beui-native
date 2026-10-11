import { Easing, ReduceMotion } from "react-native-reanimated";

// Mirrors beUI's lib/ease.ts so native motion matches the web library.

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

/** Press feedback on buttons and other tappable surfaces. */
export const SPRING_PRESS = {
  stiffness: 500,
  damping: 30,
  mass: 0.6,
  reduceMotion: ReduceMotion.System,
} as const;

/** Content swaps: label and icon slots trading places inside a control. */
export const SPRING_SWAP = {
  stiffness: 460,
  damping: 30,
  mass: 0.55,
  reduceMotion: ReduceMotion.System,
} as const;

/** Shared-layout glides: pills, indicators and panels moving between positions. */
export const SPRING_LAYOUT = {
  stiffness: 360,
  damping: 32,
  mass: 0.6,
  reduceMotion: ReduceMotion.System,
} as const;

/** Dragged handles and fills; critically damped so values never rebound off an end. */
export const SPRING_GLIDE = {
  stiffness: 700,
  damping: 50,
  mass: 0.5,
  reduceMotion: ReduceMotion.System,
} as const;

export const motion = {
  press: SPRING_PRESS,
  swap: SPRING_SWAP,
  layout: SPRING_LAYOUT,
  glide: SPRING_GLIDE,
  exit: { duration: 160, easing: EASE_OUT, reduceMotion: ReduceMotion.System },
  fade: { duration: 150, reduceMotion: ReduceMotion.System },
} as const;
