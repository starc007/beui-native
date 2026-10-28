import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewInstance,
  type ViewProps,
} from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import {
  BookGlyph,
  ChevronDownGlyph,
  ExternalGlyph,
  GlobeGlyph,
} from "../../primitives/agent-icons";
import { Disclosure } from "../../primitives/disclosure";
import { Overlay } from "../../primitives/overlay";
import { RiseIn } from "../../primitives/rise-in";
import { EASE_OUT, SPRING_SWAP } from "../../styles/motion";

export type CitationItem = {
  id: string;
  title: string;
  domain?: string;
  /** Opens on tap, and supplies the favicon. */
  url?: string;
  /** Replaces the favicon, such as a document icon for files. */
  icon?: ReactNode;
};

const SPRING_POP = {
  stiffness: 420,
  damping: 32,
  mass: 0.6,
  reduceMotion: ReduceMotion.System,
};
const CARD_EXIT = { duration: 140, easing: EASE_OUT };
const CARD_WIDTH = 288;
const EDGE = 16;
const GAP = 8;

function faviconFor(url?: string) {
  if (!url) return null;
  try {
    return new URL("/favicon.ico", url).toString();
  } catch {
    return null;
  }
}

export type CitationFaviconProps = {
  url?: string;
  icon?: ReactNode;
  size?: number;
};

/** A source's favicon, its custom icon, or a globe when neither loads. */
export function CitationFavicon({
  url,
  icon,
  size = 16,
}: CitationFaviconProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const { color: muted } = useResolveClassNames("text-muted");
  const src = faviconFor(url);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.favicon, { width: size + 4, height: size + 4 }]}
    >
      {icon ? (
        icon
      ) : src && src !== failed ? (
        <Image
          source={{ uri: src }}
          onError={() => setFailed(src)}
          style={{ width: size, height: size, borderRadius: 3 }}
        />
      ) : (
        <GlobeGlyph size={size - 2} color={muted} />
      )}
    </View>
  );
}

export type CitationStackProps = { citations: CitationItem[]; limit?: number };

/** Up to `limit` (3) overlapping favicons, as a compact hint of the sources. */
export function CitationStack({ citations, limit = 3 }: CitationStackProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.stack}
    >
      {citations.slice(0, limit).map((item, index) => (
        <View
          key={item.id}
          style={[styles.stackItem, index > 0 && styles.overlap]}
          className="border-2 border-background bg-background"
        >
          <CitationFavicon url={item.url} icon={item.icon} size={14} />
        </View>
      ))}
    </View>
  );
}

function open(item: CitationItem, onOpenSource?: (item: CitationItem) => void) {
  if (onOpenSource) onOpenSource(item);
  else if (item.url) void Linking.openURL(item.url);
}

type Anchor = { x: number; y: number; width: number; height: number };

/** The card a tapped marker springs up into. */
function SourceCard({
  item,
  index,
  anchor,
  visible,
  reduce,
  onOpenSource,
  onClose,
}: {
  item: CitationItem;
  index: number;
  anchor: Anchor | null;
  visible: boolean;
  reduce: boolean;
  onOpenSource?: (item: CitationItem) => void;
  onClose: () => void;
}) {
  const window = useWindowDimensions();
  const [present, setPresent] = useState(visible);
  const [height, setHeight] = useState(0);
  const progress = useSharedValue(0);
  if (visible && !present) setPresent(true);
  const hide = () => setPresent(false);

  useEffect(() => {
    if (!present) return;
    if (visible)
      progress.value = reduce
        ? withTiming(1, { duration: 120 })
        : withSpring(1, SPRING_POP);
    else
      progress.value = withTiming(
        0,
        reduce ? { duration: 120 } : CARD_EXIT,
        (done) => {
          if (done) scheduleOnRN(hide);
        },
      );
  }, [present, progress, reduce, visible]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: Math.min(1, p * 1.5),
      transform: reduce ? [] : [{ scale: 0.6 + p * 0.4 }],
    };
  }, [reduce]);

  if (!present || !anchor) return null;
  const width = Math.min(CARD_WIDTH, window.width - EDGE * 2);
  const left = Math.max(
    EDGE,
    Math.min(
      anchor.x + anchor.width / 2 - width / 2,
      window.width - width - EDGE,
    ),
  );
  // Above the marker when there's room, otherwise below it.
  const above = anchor.y - GAP - height > EDGE + 40;
  const top = above ? anchor.y - GAP - height : anchor.y + anchor.height + GAP;
  const originX = anchor.x + anchor.width / 2 - left;

  return (
    <Overlay onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Close source"
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      />
      <Animated.View
        accessibilityViewIsModal
        onLayout={({ nativeEvent }) => setHeight(nativeEvent.layout.height)}
        style={[
          styles.card,
          {
            left,
            top,
            width,
            transformOrigin: [originX, above ? "100%" : "0%", 0],
          },
          style,
        ]}
        className="gap-3 rounded-2xl border border-border bg-background p-3"
      >
        <View style={styles.cardRow}>
          <CitationFavicon url={item.url} icon={item.icon} size={20} />
          <View style={styles.flex}>
            <Text
              numberOfLines={2}
              className="text-sm font-medium text-foreground"
            >
              {item.title}
            </Text>
            {item.domain ? (
              <Text numberOfLines={1} className="text-xs text-muted">
                {item.domain}
              </Text>
            ) : null}
          </View>
          <Text
            className="text-[10px] font-semibold text-muted"
            style={styles.tabular}
          >
            {index}
          </Text>
        </View>
        {item.url || onOpenSource ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => {
              onClose();
              open(item, onOpenSource);
            }}
            style={styles.openButton}
            className="rounded-xl bg-primary active:opacity-80"
          >
            <Text className="text-sm font-medium text-on-primary">
              Open source
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </Overlay>
  );
}

export type CitationProps = {
  item: CitationItem;
  /** The number shown, usually the source's position starting at 1. */
  index: number;
  /** Replaces opening the URL. */
  onOpenSource?: (item: CitationItem) => void;
  /** Defaults to "Citation {index}: {title}". */
  label?: string;
  disableAnimation?: boolean;
};

/**
 * An inline citation number. Tapping it springs a card up out of the marker
 * with the source and a button to open it, so you never lose your place.
 */
export function Citation({
  item,
  index,
  onOpenSource,
  label,
  disableAnimation = false,
}: CitationProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const ref = useRef<ViewInstance>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [visible, setVisible] = useState(false);

  return (
    // One inline view: the card's modal lives inside the marker so it adds
    // nothing to the line of text around it.
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label ?? `Citation ${index}: ${item.title}`}
      hitSlop={10}
      onPress={() =>
        ref.current?.measureInWindow((x, y, width, height) => {
          setAnchor({ x, y, width, height });
          setVisible(true);
        })
      }
      style={styles.marker}
      className="rounded-md bg-surface active:bg-border-strong"
    >
      <Text
        className="text-[10px] font-semibold text-muted"
        style={styles.tabular}
      >
        {index}
      </Text>
      <SourceCard
        item={item}
        index={index}
        anchor={anchor}
        visible={visible}
        reduce={reduce}
        onOpenSource={onOpenSource}
        onClose={() => setVisible(false)}
      />
    </Pressable>
  );
}

function CitationRow({
  item,
  index,
  reduce,
  onOpenSource,
}: {
  item: CitationItem;
  index: number;
  reduce: boolean;
  onOpenSource?: (item: CitationItem) => void;
}) {
  const { color: muted } = useResolveClassNames("text-muted");
  const tappable = Boolean(item.url || onOpenSource);
  return (
    <RiseIn reduce={reduce}>
      <Pressable
        accessibilityRole={tappable ? "link" : undefined}
        accessibilityLabel={`${index}. ${item.title}${item.domain ? `, ${item.domain}` : ""}`}
        disabled={!tappable}
        onPress={() => open(item, onOpenSource)}
        style={styles.row}
        className="rounded-lg px-1.5 py-1.5 active:bg-surface"
      >
        <CitationFavicon url={item.url} icon={item.icon} />
        <View style={styles.flex}>
          <Text
            numberOfLines={1}
            className="text-sm font-medium text-foreground/80"
          >
            {item.title}
          </Text>
          {item.domain ? (
            <Text numberOfLines={1} className="text-xs text-muted/70">
              {item.domain}
            </Text>
          ) : null}
        </View>
        <View style={styles.badge} className="rounded-md bg-foreground/5">
          <Text
            className="text-[10px] font-semibold text-muted"
            style={styles.tabular}
          >
            {index}
          </Text>
        </View>
        {tappable ? <ExternalGlyph size={14} color={muted} /> : null}
      </Pressable>
    </RiseIn>
  );
}

export type CitationListProps = {
  citations: CitationItem[];
  onOpenSource?: (item: CitationItem) => void;
  disableAnimation?: boolean;
};

/** The sources as rows that rise in as they arrive. Tap one to open it. */
export function CitationList({
  citations,
  onOpenSource,
  disableAnimation = false,
}: CitationListProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  return (
    <View className="gap-0.5">
      {citations.map((item, index) => (
        <CitationRow
          key={item.id}
          item={item}
          index={index + 1}
          reduce={reduce}
          onOpenSource={onOpenSource}
        />
      ))}
    </View>
  );
}

export type CitationsProps = Omit<ViewProps, "children"> & {
  citations: CitationItem[];
  /** Defaults to "Sources". */
  title?: string;
  open?: boolean;
  /** Defaults to false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpenSource?: (item: CitationItem) => void;
  className?: string;
  disableAnimation?: boolean;
};

/** A "Sources" toggle with a count that folds open into the source list. */
export function Citations({
  citations,
  title = "Sources",
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onOpenSource,
  className = "",
  disableAnimation = false,
  ...props
}: CitationsProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? internalOpen;
  const turn = useSharedValue(isOpen ? 1 : 0);
  const { color: muted } = useResolveClassNames("text-muted");

  useEffect(() => {
    turn.value = reduce
      ? isOpen
        ? 1
        : 0
      : withSpring(isOpen ? 1 : 0, SPRING_SWAP);
  }, [isOpen, reduce, turn]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 180}deg` }],
  }));

  const toggle = () => {
    if (controlledOpen === undefined) setInternalOpen(!isOpen);
    onOpenChange?.(!isOpen);
  };

  return (
    <View className={`w-full ${className}`} {...props}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${title}, ${citations.length}`}
        onPress={toggle}
        hitSlop={6}
        style={styles.trigger}
      >
        <BookGlyph size={16} color={muted} />
        <Text className="text-sm font-medium text-muted">{title}</Text>
        <View className="rounded-full bg-surface px-1.5 py-0.5">
          <Text
            className="text-[10px] font-semibold text-muted"
            style={styles.tabular}
          >
            {citations.length}
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDownGlyph size={14} color={muted} />
        </Animated.View>
      </Pressable>
      <Disclosure open={isOpen} reduce={reduce}>
        <View className="mt-1">
          <CitationList
            citations={citations}
            onOpenSource={onOpenSource}
            disableAnimation={disableAnimation}
          />
        </View>
      </Disclosure>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  favicon: { alignItems: "center", justifyContent: "center" },
  stack: { flexDirection: "row" },
  stackItem: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  overlap: { marginLeft: -6 },
  marker: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -2 }],
  },
  card: {
    position: "absolute",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  openButton: { minHeight: 40, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  badge: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 36,
    alignSelf: "flex-start",
  },
  tabular: { fontVariant: ["tabular-nums"] },
});
