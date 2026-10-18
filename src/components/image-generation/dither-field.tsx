import {
  Canvas,
  createPicture,
  Picture,
  Skia,
} from "@shopify/react-native-skia";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SPRING_SWAP } from "../../styles/motion";

const GAP = 10;
const WANDER_FOLLOW = 0.045;
const FINGER_FOLLOW = 0.16;

/**
 * A lattice of dots with a soft lens that wanders across it: dots inside the
 * lens grow, brighten and push outward. Drag a finger and the lens follows it,
 * swelling under your touch.
 */
export function DitherField({
  color,
  animate,
  interactive,
}: {
  color: string;
  animate: boolean;
  interactive: boolean;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const time = useSharedValue(0);
  const x = useSharedValue(-1);
  const y = useSharedValue(-1);
  const targetX = useSharedValue(0);
  const targetY = useSharedValue(0);
  const touching = useSharedValue(false);
  const swell = useSharedValue(1);
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const dot = Skia.Color(color);

  useFrameCallback((frame) => {
    const dt = Math.min(0.05, (frame.timeSincePreviousFrame ?? 16) / 1000);
    time.value += dt * 1000;
    const w = width.value;
    const h = height.value;
    if (!touching.value) {
      targetX.value = w / 2 + Math.sin(time.value / 1700) * w * 0.12;
      targetY.value = h / 2 + Math.cos(time.value / 2100) * h * 0.1;
    }
    if (x.value < 0) {
      x.value = targetX.value;
      y.value = targetY.value;
    }
    // Frame-rate independent easing toward the target.
    const base = touching.value ? FINGER_FOLLOW : WANDER_FOLLOW;
    const follow = 1 - (1 - base) ** (dt * 60);
    x.value += (targetX.value - x.value) * follow;
    y.value += (targetY.value - y.value) * follow;
  }, animate);

  const picture = useDerivedValue(() => {
    const w = width.value;
    const h = height.value;
    const cx = x.value < 0 ? w / 2 : x.value;
    const cy = y.value < 0 ? h / 2 : y.value;
    return createPicture((canvas) => {
      const paint = Skia.Paint();
      paint.setColor(dot);
      const radius = Math.min(w, h) * 0.38 * swell.value;
      const columns = Math.ceil(w / GAP) + 1;
      const rows = Math.ceil(h / GAP) + 1;
      const offsetX = (w - (columns - 1) * GAP) / 2;
      const offsetY = (h - (rows - 1) * GAP) / 2;
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const anchorX = offsetX + column * GAP;
          const anchorY = offsetY + row * GAP;
          const dX = anchorX - cx;
          const dY = anchorY - cy;
          const distance = Math.hypot(dX, dY);
          const proximity = Math.max(0, 1 - distance / radius);
          const influence = proximity * proximity * (3 - 2 * proximity);
          const push = influence * influence * 9;
          const px = distance > 0 ? anchorX + (dX / distance) * push : anchorX;
          const py = distance > 0 ? anchorY + (dY / distance) * push : anchorY;
          paint.setAlphaf(0.17 + influence * 0.72);
          canvas.drawCircle(px, py, 0.65 + influence * 0.85, paint);
        }
      }
    });
  });

  const steer = Gesture.Pan()
    .enabled(interactive)
    .minDistance(0)
    .onBegin((event) => {
      touching.value = true;
      targetX.value = event.x;
      targetY.value = event.y;
      swell.value = withSpring(1.25, SPRING_SWAP);
    })
    .onUpdate((event) => {
      targetX.value = event.x;
      targetY.value = event.y;
    })
    .onFinalize(() => {
      touching.value = false;
      swell.value = withSpring(1, SPRING_SWAP);
    });

  return (
    <GestureDetector gesture={steer}>
      <View
        style={StyleSheet.absoluteFill}
        onLayout={({ nativeEvent }) => {
          const next = {
            width: nativeEvent.layout.width,
            height: nativeEvent.layout.height,
          };
          width.value = next.width;
          height.value = next.height;
          setSize(next);
        }}
      >
        {size.width > 0 ? (
          <Canvas style={StyleSheet.absoluteFill}>
            <Picture picture={picture} />
          </Canvas>
        ) : null}
      </View>
    </GestureDetector>
  );
}
