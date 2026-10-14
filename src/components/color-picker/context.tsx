import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, type ViewProps } from "react-native";
import {
  ReduceMotion,
  type SharedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import {
  BLACK,
  clamp,
  formatHex,
  type Hsva,
  hsvaToRgba,
  parseHex,
  type Rgba,
  rgbaToHsva,
} from "./color";

/** A frame in window coordinates. */
export type Frame = { x: number; y: number; width: number; height: number };

// The panel's one spring, in both directions: the chip grows into the area
// and the panel settles with a light bounce, then the same motion plays back
// to close. Matches the web version's morph (0.5 s, bounce 0.2).
export const MORPH = {
  duration: 500,
  dampingRatio: 0.8,
  reduceMotion: ReduceMotion.System,
};

export type ColorPickerContextValue = {
  hsva: Hsva;
  rgba: Rgba;
  hex: string;
  alpha: boolean;
  disabled: boolean;
  reduce: boolean;
  /** Sets the color live, clamping each channel. */
  update: (next: Hsva) => void;
  /** Reports the settled color through onValueCommit. */
  commit: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** 0 closed to 1 open; drives the morph, the panel and its rows. */
  progress: SharedValue<number>;
  /** The trigger's color chip, which the area grows out of. */
  chipRef: RefObject<View | null>;
  chipFrame: Frame | null;
  /** The trigger, which the panel lines up under. */
  triggerRef: RefObject<View | null>;
  triggerFrame: Frame | null;
};

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null);

/**
 * Inside ColorPickerContent: the area reports its frame within the panel, so
 * the trigger's chip can grow into exactly that spot, and it fades in as the
 * chip arrives.
 */
export const PanelContext = createContext<{
  reportArea: (frame: Frame) => void;
} | null>(null);

export function usePickerContext(component: string) {
  const context = useContext(ColorPickerContext);
  if (!context) {
    throw new Error(`${component} must be used within <ColorPicker>`);
  }
  return context;
}

/** The picker's state, for custom parts. */
export function useColorPicker() {
  const { hsva, rgba, hex, update, commit, open, setOpen } =
    usePickerContext("useColorPicker");
  return { hsva, rgba, hex, update, commit, open, setOpen };
}

export type ColorPickerProps = Omit<ViewProps, "children"> & {
  /** Controlled hex color. Omit it and use `defaultValue` for uncontrolled use. */
  value?: string;
  /** Defaults to "#3478f6". */
  defaultValue?: string;
  /** Called on every change, such as each step of a drag. */
  onValueChange?: (value: string) => void;
  /** Called when a change settles: a drag ends, a field is submitted, a preset is picked. */
  onValueCommit?: (value: string) => void;
  /** Allows translucent colors and shows the opacity slider. Defaults to true. */
  alpha?: boolean;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Moves without springing, independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * A color picker built from parts: ColorPickerTrigger opens ColorPickerContent,
 * which holds the area, sliders, fields and presets. The parts also work
 * inline, without a trigger.
 */
export function ColorPicker({
  value,
  defaultValue = "#3478f6",
  onValueChange,
  onValueCommit,
  alpha = true,
  disabled = false,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disableAnimation = false,
  className = "",
  children,
  ...props
}: ColorPickerProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const chipRef = useRef<View>(null);
  const triggerRef = useRef<View>(null);
  const [chipFrame, setChipFrame] = useState<Frame | null>(null);
  const [triggerFrame, setTriggerFrame] = useState<Frame | null>(null);
  const progress = useSharedValue(defaultOpen ? 1 : 0);

  const [openInternal, setOpenInternal] = useState(defaultOpen);
  const open = openProp ?? openInternal;
  const setOpen = useCallback(
    (next: boolean) => {
      if (next === open || (next && disabled)) return;
      const apply = () => {
        if (openProp === undefined) setOpenInternal(next);
        onOpenChange?.(next);
      };
      if (!next) {
        apply();
        return;
      }
      // Find the trigger and its chip on screen before the panel grows from them.
      let pending = 2;
      const done = () => {
        pending -= 1;
        if (pending === 0) apply();
      };
      const measure = (
        ref: RefObject<View | null>,
        set: (frame: Frame) => void,
      ) => {
        if (!ref.current) {
          done();
          return;
        }
        ref.current.measureInWindow((x, y, width, height) => {
          set({ x, y, width, height });
          done();
        });
      };
      measure(triggerRef, setTriggerFrame);
      measure(chipRef, setChipFrame);
    },
    [disabled, onOpenChange, open, openProp],
  );

  const controlled = value !== undefined;
  const incoming = controlled ? value : defaultValue;
  const [state, setState] = useState(() => ({
    source: incoming,
    hsva: rgbaToHsva(parseHex(incoming) ?? BLACK),
  }));

  // A controlled value the picker didn't emit is read during render, so the
  // thumbs never show a stale color for a frame.
  let hsva = state.hsva;
  if (controlled && value !== state.source) {
    const parsed = parseHex(value);
    hsva = parsed ? rgbaToHsva(parsed, state.hsva) : state.hsva;
    setState({ source: value, hsva });
  }
  if (!alpha && hsva.a !== 1) hsva = { ...hsva, a: 1 };

  const rgba = hsvaToRgba(hsva);
  const hex = formatHex(rgba);
  // Handlers read the latest emitted hex, which can be ahead of the render.
  const hexRef = useRef(hex);
  hexRef.current = hex;

  const update = useCallback(
    (next: Hsva) => {
      const clean: Hsva = {
        h: clamp(next.h, 0, 360),
        s: clamp(next.s, 0, 100),
        v: clamp(next.v, 0, 100),
        a: alpha ? clamp(next.a, 0, 1) : 1,
      };
      const nextHex = formatHex(hsvaToRgba(clean));
      const changed = nextHex !== hexRef.current;
      hexRef.current = nextHex;
      setState({ source: nextHex, hsva: clean });
      if (changed) onValueChange?.(nextHex);
    },
    [alpha, onValueChange],
  );
  const commit = useCallback(
    () => onValueCommit?.(hexRef.current),
    [onValueCommit],
  );

  const context = useMemo<ColorPickerContextValue>(
    () => ({
      hsva,
      rgba,
      hex,
      alpha,
      disabled,
      reduce,
      update,
      commit,
      open,
      setOpen,
      progress,
      chipRef,
      chipFrame,
      triggerRef,
      triggerFrame,
    }),
    [
      alpha,
      chipFrame,
      commit,
      disabled,
      hex,
      hsva,
      open,
      progress,
      reduce,
      rgba,
      setOpen,
      triggerFrame,
      update,
    ],
  );

  return (
    <ColorPickerContext.Provider value={context}>
      <View
        {...props}
        className={`${disabled ? "opacity-50" : ""} ${className}`}
      >
        {children}
      </View>
    </ColorPickerContext.Provider>
  );
}
