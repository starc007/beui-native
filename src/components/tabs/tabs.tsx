import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type LayoutRectangle,
  Platform,
  Pressable,
  type PressableProps,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import Animated, {
  ReduceMotion,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import { type IconSource, renderIcon } from "../../primitives/render-icon";
import { EASE_OUT, SPRING_SWAP } from "../../styles/motion";

export type TabsVariant = "pill" | "segment" | "underline";
/** Whether trigger icons show on every tab or only on the selected one. */
export type TabsIcons = "always" | "selected";

// Settles without overshoot, so the indicator never pokes past the list edges.
const INDICATOR_SPRING = {
  stiffness: 245,
  damping: 36,
  mass: 1.2,
  reduceMotion: ReduceMotion.System,
} as const;
const CONTENT_FADE = {
  duration: 180,
  easing: EASE_OUT,
  reduceMotion: ReduceMotion.System,
};
// Layout sizes can round below the text's real width; a little slack stops the
// overlay label from truncating while keeping it centered.
const SLACK = 1;
// Trigger icons sit before the label at the label's text size.
const ICON_SIZE = 14;
const ICON_GAP = 6;
// Width of the fade over a list edge that has more tabs past it.
const EDGE_FADE = 24;
// Space kept between a revealed tab and the edge, so it clears the fade.
const REVEAL_MARGIN = EDGE_FADE + 8;
// The color behind each variant's tabs, which the edge fades blend into.
const fadeColors: Record<TabsVariant, string> = {
  pill: "bg-surface",
  segment: "bg-surface",
  underline: "bg-background",
};

/** The same color at zero alpha, so a gradient fades without graying. */
function transparentOf(color: string) {
  const hex = color.match(/^#([0-9a-f]{6})$/i)?.[1];
  if (hex) {
    const [r, g, b] = [0, 2, 4].map((i) =>
      Number.parseInt(hex.slice(i, i + 2), 16),
    );
    return `rgba(${r}, ${g}, ${b}, 0)`;
  }
  const rgb = color.match(/^rgba?\(([^,]+),([^,]+),([^,)]+)/);
  if (rgb) return `rgba(${rgb[1]},${rgb[2]},${rgb[3]}, 0)`;
  return "transparent";
}

/** A horizontal gradient, on native through experimental_backgroundImage. */
function fadeStyle(color: string, toward: "left" | "right") {
  const gradient = `linear-gradient(to ${toward}, ${transparentOf(color)}, ${color})`;
  return Platform.OS === "web"
    ? ({ backgroundImage: gradient } as object)
    : { experimental_backgroundImage: gradient };
}

const surfaces: Record<TabsVariant, string> = {
  pill: "rounded-full bg-surface",
  segment: "rounded-lg bg-surface",
  underline: "",
};
const lists: Record<TabsVariant, string> = {
  pill: "p-1 gap-1",
  segment: "p-0.5",
  // The border sits on the list so the indicator can overlap it inside the scroll view.
  underline: "gap-1 border-b border-border",
};
const triggers: Record<TabsVariant, string> = {
  pill: "px-3.5 py-1.5 rounded-full",
  segment: "px-3.5 py-1.5 rounded-md",
  underline: "min-h-11 px-3 pt-1 pb-2.5",
};
const indicatorRadius: Record<TabsVariant, number> = {
  pill: 9999,
  segment: 8,
  underline: 0,
};

type TabsContextValue = {
  value: string;
  select: (value: string) => void;
  variant: TabsVariant;
  icons: TabsIcons;
  animate: boolean;
};

type Indicator = {
  x: SharedValue<number>;
  width: SharedValue<number>;
  visible: SharedValue<number>;
  report: (value: string, layout: LayoutRectangle) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);
const IndicatorContext = createContext<Indicator | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs parts must be rendered inside Tabs.");
  return context;
}

export type TabsProps = ViewProps & {
  /** Controlled value. Omit it and use `defaultValue` for uncontrolled use. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  /**
   * With "selected", a trigger's icon springs open only on the selected tab
   * and folds away when another is chosen. Defaults to "always".
   */
  icons?: TabsIcons;
  /** Disables indicator and content motion independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
};

export function Tabs({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  variant = "pill",
  icons = "always",
  disableAnimation = false,
  ...props
}: TabsProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = valueProp ?? uncontrolled;
  const reducedMotion = useReducedMotionPreference();
  const animate = !reducedMotion && !disableAnimation;

  const context = useMemo<TabsContextValue>(
    () => ({
      value,
      variant,
      icons,
      animate,
      select: (next) => {
        if (valueProp === undefined) setUncontrolled(next);
        onValueChange?.(next);
      },
    }),
    [animate, icons, onValueChange, value, valueProp, variant],
  );

  return (
    <TabsContext.Provider value={context}>
      <View {...props} />
    </TabsContext.Provider>
  );
}

export type TabsListProps = Omit<ViewProps, "children"> & {
  /** `TabsTrigger` elements. They must be direct children so they can be measured. */
  children: ReactNode;
  className?: string;
  /** Overrides the indicator's color utility, such as `bg-foreground`. */
  indicatorClassName?: string;
};

export function TabsList({
  children,
  className = "",
  indicatorClassName,
  ...props
}: TabsListProps) {
  const { value, variant, animate } = useTabs();
  const layouts = useRef(new Map<string, LayoutRectangle>());
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const viewportWidth = useRef(0);
  const contentWidth = useRef(0);
  const [edges, setEdges] = useState({ start: false, end: false });
  const { backgroundColor: fadeColor } = useResolveClassNames(
    fadeColors[variant],
  );
  const valueRef = useRef(value);
  valueRef.current = value;
  const animateRef = useRef(animate);
  animateRef.current = animate;

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const visible = useSharedValue(0);

  // Show a fade on each side that has tabs scrolled out of view.
  const updateEdges = useCallback(() => {
    const max = contentWidth.current - viewportWidth.current;
    const next = {
      start: scrollX.current > 1,
      end: max > 1 && scrollX.current < max - 1,
    };
    setEdges((current) =>
      current.start === next.start && current.end === next.end ? current : next,
    );
  }, []);

  // Keep the selected tab clear of the viewport edges when the list scrolls.
  const reveal = useCallback((layout: LayoutRectangle) => {
    const viewport = viewportWidth.current;
    if (!viewport) return;
    const start = scrollX.current;
    let target = start;
    if (layout.x < start + REVEAL_MARGIN) {
      target = layout.x - REVEAL_MARGIN;
    } else if (layout.x + layout.width > start + viewport - REVEAL_MARGIN) {
      target = layout.x + layout.width - viewport + REVEAL_MARGIN;
    }
    if (target !== start) {
      scrollRef.current?.scrollTo({
        x: Math.max(0, target),
        animated: animateRef.current,
      });
    }
  }, []);

  const move = useCallback(
    // `follow` is a size change on the tab already targeted, such as its icon
    // springing open. The indicator tracks it on the icon's own spring, so
    // the pill never lags behind a tab that is still growing.
    (target: string, follow = false) => {
      const layout = layouts.current.get(target);
      if (!layout) {
        visible.value = 0;
        return;
      }
      // Height and vertical position never animate; only the glide does.
      y.value = layout.y;
      height.value = layout.height;
      if (visible.value === 0 || !animateRef.current) {
        x.value = layout.x;
        width.value = layout.width;
      } else {
        const spring = follow ? SPRING_SWAP : INDICATOR_SPRING;
        x.value = withSpring(layout.x, spring);
        width.value = withSpring(layout.width, spring);
      }
      visible.value = 1;
      reveal(layout);
    },
    [height, reveal, visible, width, x, y],
  );

  useEffect(() => {
    move(value);
  }, [move, value]);

  const report = useCallback(
    (item: string, layout: LayoutRectangle) => {
      layouts.current.set(item, layout);
      if (item === valueRef.current) move(item, true);
    },
    [move],
  );

  const indicator = useMemo<Indicator>(
    () => ({ x, width, visible, report }),
    [report, visible, width, x],
  );

  const indicatorStyle = useAnimatedStyle(() =>
    variant === "underline"
      ? {
          opacity: visible.value,
          width: width.value,
          transform: [{ translateX: x.value }],
        }
      : {
          opacity: visible.value,
          width: width.value,
          height: height.value,
          transform: [{ translateX: x.value }, { translateY: y.value }],
        },
  );

  return (
    <IndicatorContext.Provider value={indicator}>
      <View
        {...props}
        className={`self-start max-w-full overflow-hidden ${surfaces[variant]} ${className}`}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroller}
          scrollEventThrottle={16}
          onScroll={(event) => {
            scrollX.current = event.nativeEvent.contentOffset.x;
            updateEdges();
          }}
          onLayout={(event) => {
            viewportWidth.current = event.nativeEvent.layout.width;
            updateEdges();
          }}
          onContentSizeChange={(width) => {
            contentWidth.current = width;
            updateEdges();
          }}
        >
          <View
            accessibilityRole="tablist"
            className={`flex-row items-center ${lists[variant]}`}
          >
            <Animated.View
              className={indicatorClassName ?? "bg-primary"}
              style={[
                variant === "underline" ? styles.underline : styles.indicator,
                { borderRadius: indicatorRadius[variant] },
                indicatorStyle,
              ]}
            />
            {children}
          </View>
        </ScrollView>
        {edges.start && fadeColor ? (
          <View
            style={[
              styles.fade,
              styles.fadeStart,
              fadeStyle(String(fadeColor), "left"),
            ]}
          />
        ) : null}
        {edges.end && fadeColor ? (
          <View
            style={[
              styles.fade,
              styles.fadeEnd,
              fadeStyle(String(fadeColor), "right"),
            ]}
          />
        ) : null}
      </View>
    </IndicatorContext.Provider>
  );
}

export type TabsTriggerProps = Omit<
  PressableProps,
  "children" | "style" | "onPress"
> & {
  value: string;
  /**
   * An icon before the label: a component given `{ size, color }`, or a
   * prebuilt node. Colored like the label in each state.
   */
  icon?: IconSource;
  /** Text children are colored for each state. Other elements render as given. */
  children: ReactNode;
  className?: string;
  onPress?: PressableProps["onPress"];
};

function TabLabel({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return typeof children === "string" || typeof children === "number" ? (
    <Text numberOfLines={1} className={`text-sm font-medium ${className}`}>
      {children}
    </Text>
  ) : (
    children
  );
}

/** A label with an optional icon before it, in one layer's colors. */
function TabContent({
  children,
  className,
  icon,
  color,
  iconStyle,
}: {
  children: ReactNode;
  className: string;
  icon?: IconSource;
  color: string | undefined;
  iconStyle: object;
}) {
  const label = <TabLabel className={className}>{children}</TabLabel>;
  if (icon == null) return label;
  return (
    <View style={styles.content}>
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.icon, iconStyle]}
      >
        {renderIcon(icon, { size: ICON_SIZE, color })}
      </Animated.View>
      {label}
    </View>
  );
}

export function TabsTrigger({
  value,
  icon,
  children,
  className = "",
  disabled,
  accessibilityState,
  onLayout,
  onPress,
  ...props
}: TabsTriggerProps) {
  const { value: current, select, variant, icons, animate } = useTabs();
  const indicator = useContext(IndicatorContext);
  if (!indicator) throw new Error("TabsTrigger must be rendered in TabsList.");
  const selected = current === value;
  const underline = variant === "underline";
  const labelClass = underline && selected ? "text-foreground" : "text-muted";
  const { color: labelColor } = useResolveClassNames(labelClass);
  const { color: onPrimary } = useResolveClassNames("text-on-primary");

  // One progress value opens the icon on both label layers at once, so the
  // on-indicator copy never drifts from the one beneath it.
  const shown = icons === "always" || selected;
  const reveal = useSharedValue(shown ? 1 : 0);
  useEffect(() => {
    reveal.value = animate
      ? withSpring(shown ? 1 : 0, SPRING_SWAP)
      : shown
        ? 1
        : 0;
  }, [animate, reveal, shown]);
  const iconStyle = useAnimatedStyle(() => ({
    width: ICON_SIZE * reveal.value,
    marginRight: ICON_GAP * reveal.value,
    opacity: reveal.value,
    transform: [{ scale: 0.6 + 0.4 * reveal.value }],
  }));
  const left = useSharedValue(0);
  const width = useSharedValue(0);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // The on-indicator label shows only where the indicator overlaps this tab.
  const clipStyle = useAnimatedStyle(() => {
    const start = Math.min(
      width.value,
      Math.max(0, indicator.x.value - left.value),
    );
    const end = Math.min(
      width.value,
      Math.max(
        0,
        left.value + width.value - (indicator.x.value + indicator.width.value),
      ),
    );
    const hidden = indicator.visible.value === 0 || start + end >= width.value;
    return {
      opacity: hidden ? 0 : 1,
      left: hidden ? 0 : start,
      right: hidden ? 0 : end,
    };
  });
  const innerStyle = useAnimatedStyle(() => ({
    left:
      -Math.min(width.value, Math.max(0, indicator.x.value - left.value)) -
      SLACK,
  }));

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{
        ...accessibilityState,
        selected,
        disabled: disabled ?? false,
      }}
      aria-selected={selected}
      disabled={disabled}
      className={`shrink-0 items-center justify-center ${triggers[variant]} ${disabled ? "opacity-50" : ""} ${className}`}
      onLayout={(event) => {
        const layout = event.nativeEvent.layout;
        left.value = layout.x;
        width.value = layout.width;
        setSize({ width: layout.width, height: layout.height });
        indicator.report(value, layout);
        onLayout?.(event);
      }}
      onPress={(event) => {
        onPress?.(event);
        if (!event.defaultPrevented) select(value);
      }}
    >
      <TabContent
        className={labelClass}
        icon={icon}
        color={labelColor == null ? undefined : String(labelColor)}
        iconStyle={iconStyle}
      >
        {children}
      </TabContent>
      {underline ? null : (
        <Animated.View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
          style={[styles.clip, clipStyle]}
        >
          <Animated.View
            className={`items-center justify-center ${triggers[variant]}`}
            style={[
              styles.clipInner,
              { width: size.width + SLACK * 2, height: size.height },
              innerStyle,
            ]}
          >
            <TabContent
              className="text-on-primary"
              icon={icon}
              color={onPrimary == null ? undefined : String(onPrimary)}
              iconStyle={iconStyle}
            >
              {children}
            </TabContent>
          </Animated.View>
        </Animated.View>
      )}
    </Pressable>
  );
}

export type TabsContentProps = ViewProps & {
  value: string;
  className?: string;
};

export function TabsContent({
  value,
  className = "",
  style,
  ...props
}: TabsContentProps) {
  const { value: current, animate } = useTabs();
  const active = current === value;
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    progress.value = 0;
    progress.value = withTiming(1, CONTENT_FADE);
  }, [active, progress]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ translateY: animate ? 4 * (1 - progress.value) : 0 }],
    }),
    [animate],
  );

  if (!active) return null;
  return (
    <Animated.View
      {...props}
      className={`mt-4 ${className}`}
      style={[style, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  // Native ScrollViews default to flexGrow: 1 and would stretch to fill the
  // page vertically; size to the tab row instead.
  scroller: { flexGrow: 0 },
  fade: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: EDGE_FADE,
    pointerEvents: "none",
  },
  fadeStart: { left: 0 },
  fadeEnd: { right: 0 },
  indicator: { position: "absolute", left: 0, top: 0 },
  underline: { position: "absolute", left: 0, bottom: -1, height: 1 },
  clip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },
  clipInner: { position: "absolute", top: 0 },
  content: { flexDirection: "row", alignItems: "center" },
  icon: {
    height: ICON_SIZE,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
