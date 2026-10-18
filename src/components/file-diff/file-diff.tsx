import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import {
  CheckGlyph,
  ChevronDownGlyph,
  CopyGlyph,
  FileGlyph,
} from "../../primitives/agent-icons";
import { type CodeLanguage, useCodeTokens } from "../../primitives/code-tokens";
import { Disclosure } from "../../primitives/disclosure";
import { SpinGlyph } from "../../primitives/spin-glyph";
import { SPRING_PRESS, SPRING_SWAP } from "../../styles/motion";
import { CodeLineText } from "../code-block/code-block";

export type FileDiffStatus = "streaming" | "complete";
export type FileDiffLineType = "added" | "removed" | "context";

export type FileDiffLine = {
  id: string;
  /** Defaults to "context". */
  type?: FileDiffLineType;
  oldLine?: number;
  newLine?: number;
  content: string;
};

const LINE = 20;
const FOLD = 28;
const NUMBER = 36;
const MARK = 16;
const COPIED_FOR = 1600;

type Segment =
  | { kind: "line"; line: FileDiffLine; index: number }
  | {
      kind: "fold";
      id: string;
      lines: { line: FileDiffLine; index: number }[];
    };

/**
 * Folds runs of unchanged lines longer than `keep * 2 + 2`, keeping `keep`
 * lines of context either side of each change.
 */
function segment(
  lines: FileDiffLine[],
  keep: number,
  expanded: Set<string>,
  streaming: boolean,
) {
  const segments: Segment[] = [];
  let run: { line: FileDiffLine; index: number }[] = [];
  const flush = (atEnd: boolean) => {
    const head = segments.length === 0 ? 0 : keep;
    // A trailing run may still grow while streaming; don't fold it yet.
    const tail = atEnd ? (streaming ? run.length : 0) : keep;
    const id = run[0]?.line.id ?? "";
    if (run.length > head + tail + 2 && !expanded.has(id)) {
      for (const item of run.slice(0, head))
        segments.push({ kind: "line", ...item });
      segments.push({
        kind: "fold",
        id,
        lines: run.slice(head, run.length - tail),
      });
      for (const item of run.slice(run.length - tail))
        segments.push({ kind: "line", ...item });
    } else {
      for (const item of run) segments.push({ kind: "line", ...item });
    }
    run = [];
  };
  lines.forEach((line, index) => {
    if ((line.type ?? "context") === "context") run.push({ line, index });
    else {
      flush(false);
      segments.push({ kind: "line", line, index });
    }
  });
  flush(true);
  return segments;
}

const ROW_TINT: Record<FileDiffLineType, string> = {
  added: "bg-success/10",
  removed: "bg-destructive/10",
  context: "",
};
const MARK_CLASS: Record<FileDiffLineType, string> = {
  added: "text-success",
  removed: "text-destructive",
  context: "text-muted/50",
};

export type FileDiffProps = Omit<ViewProps, "children"> & {
  /** The file's path. */
  file: string;
  lines: FileDiffLine[];
  /** Defaults to "streaming". */
  status?: FileDiffStatus;
  open?: boolean;
  /** Defaults to true. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Folds the diff away once the changes are applied. Defaults to true. */
  collapseOnComplete?: boolean;
  /** Tallest the diff grows before it scrolls. Defaults to 220. */
  maxHeight?: number;
  /** Defaults to "typescript". */
  language?: CodeLanguage;
  /** Unchanged lines kept beside each change before the rest fold. Defaults to 2. */
  context?: number;
  /** Shows a copy button. Copy with your clipboard library here. */
  onCopy?: () => unknown;
  className?: string;
  disableAnimation?: boolean;
};

/**
 * A file's changes as they're applied: added and removed lines with live
 * counts. Line numbers stay put while code scrolls sideways, and long
 * unchanged stretches fold into a row you can tap open.
 */
export function FileDiff({
  file,
  lines,
  status = "streaming",
  open: controlledOpen,
  defaultOpen = true,
  onOpenChange,
  collapseOnComplete = true,
  maxHeight = 220,
  language = "typescript",
  context = 2,
  onCopy,
  className = "",
  disableAnimation = false,
  ...props
}: FileDiffProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const streaming = status === "streaming";
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState(0);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const previous = useRef(status);
  const scrollRef = useRef<ScrollView>(null);
  const following = useRef(true);
  const dragging = useRef(false);
  const turn = useSharedValue(open ? 1 : 0);
  const copyScale = useSharedValue(1);
  const tokens = useCodeTokens(
    lines.map((line) => line.content).join("\n"),
    language,
  );
  const additions = lines.filter((line) => line.type === "added").length;
  const deletions = lines.filter((line) => line.type === "removed").length;
  const segments = segment(lines, context, expanded, streaming);
  const { color: muted } = useResolveClassNames("text-muted");
  const { color: foreground } = useResolveClassNames("text-foreground");

  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    const was = previous.current;
    previous.current = status;
    if (was !== "streaming" && status === "streaming") {
      following.current = true;
      setOpen(true);
    } else if (
      was === "streaming" &&
      status === "complete" &&
      collapseOnComplete
    )
      setOpen(false);
  });
  useEffect(() => () => clearTimeout(copiedTimer.current), []);
  useEffect(() => {
    turn.value = reduce
      ? open
        ? 1
        : 0
      : withSpring(open ? 1 : 0, SPRING_SWAP);
  }, [open, reduce, turn]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 180}deg` }],
  }));
  const copyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: copyScale.value }],
  }));

  const copy = async () => {
    await onCopy?.();
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_FOR);
  };
  const unfold = (id: string) =>
    setExpanded((current) => new Set(current).add(id));

  const foldLabel = (count: number) =>
    `${count} unchanged ${count === 1 ? "line" : "lines"}`;

  // The fixed side: old and new line numbers and the +/− marker.
  const gutter = segments.map((item) =>
    item.kind === "fold" ? (
      <Pressable
        key={`fold-${item.id}`}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onPress={() => unfold(item.id)}
        style={styles.foldGutter}
        className="bg-foreground/5"
      >
        <Text className="text-xs text-muted">⋯</Text>
      </Pressable>
    ) : (
      <View
        key={item.line.id}
        style={styles.gutterRow}
        className={ROW_TINT[item.line.type ?? "context"]}
      >
        <Text
          className="font-mono text-xs text-muted/50"
          style={[styles.number, styles.tabular]}
        >
          {item.line.oldLine ?? ""}
        </Text>
        <Text
          className="font-mono text-xs text-muted/50"
          style={[styles.number, styles.tabular]}
        >
          {item.line.newLine ?? ""}
        </Text>
        <Text
          className={`font-mono text-xs ${MARK_CLASS[item.line.type ?? "context"]}`}
          style={styles.mark}
        >
          {item.line.type === "added"
            ? "+"
            : item.line.type === "removed"
              ? "−"
              : ""}
        </Text>
      </View>
    ),
  );

  const code = segments.map((item) =>
    item.kind === "fold" ? (
      <Pressable
        key={`fold-${item.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Show ${foldLabel(item.lines.length)}`}
        onPress={() => unfold(item.id)}
        style={styles.fold}
        className="bg-foreground/5 px-1.5"
      >
        <Text className="text-xs font-medium text-muted">
          {foldLabel(item.lines.length)}
        </Text>
      </Pressable>
    ) : (
      <View
        key={item.line.id}
        accessible
        accessibilityLabel={`${
          item.line.type === "added"
            ? "Added"
            : item.line.type === "removed"
              ? "Removed"
              : "Line"
        } ${item.line.newLine ?? item.line.oldLine ?? ""}: ${item.line.content}`}
        className={`${ROW_TINT[item.line.type ?? "context"]} px-1.5`}
      >
        <CodeLineText tokens={tokens[item.index] ?? []} />
      </View>
    ),
  );

  const gutterWidth = NUMBER * 2 + MARK;

  return (
    <View
      accessibilityState={{ busy: streaming }}
      className={`w-full ${className}`}
      {...props}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${file}, ${additions} added, ${deletions} removed, ${
          streaming ? "applying changes" : "changes applied"
        }`}
        onPress={() => setOpen(!open)}
        style={styles.header}
        className="py-1"
      >
        <FileGlyph size={16} color={muted} />
        <Text
          numberOfLines={1}
          className="flex-1 font-mono text-xs text-foreground/80"
        >
          {file}
        </Text>
        <View style={styles.counts}>
          {additions > 0 ? (
            <Text
              className="font-mono text-xs text-success"
              style={styles.tabular}
            >
              +{additions}
            </Text>
          ) : null}
          {deletions > 0 ? (
            <Text
              className="font-mono text-xs text-destructive"
              style={styles.tabular}
            >
              −{deletions}
            </Text>
          ) : null}
        </View>
        <View style={styles.statusIcon}>
          {streaming ? (
            <SpinGlyph size={14} color={muted} reduce={reduce} />
          ) : (
            <CheckGlyph size={14} color={muted} />
          )}
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDownGlyph size={14} color={muted} />
        </Animated.View>
      </Pressable>
      <Disclosure open={open} reduce={reduce}>
        <View className="pl-6 pt-1.5">
          <View className="overflow-hidden rounded-xl bg-surface">
            <ScrollView
              ref={scrollRef}
              style={[styles.fixed, { maxHeight }]}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={32}
              onLayout={({ nativeEvent }) =>
                setViewport(nativeEvent.layout.width)
              }
              onScrollBeginDrag={() => {
                dragging.current = true;
              }}
              onMomentumScrollEnd={() => {
                dragging.current = false;
              }}
              onScrollEndDrag={({ nativeEvent }) => {
                if (!nativeEvent.velocity?.y) dragging.current = false;
              }}
              onScroll={({ nativeEvent }) => {
                if (!dragging.current) return;
                const { contentOffset, contentSize, layoutMeasurement } =
                  nativeEvent;
                following.current =
                  contentSize.height -
                    contentOffset.y -
                    layoutMeasurement.height <
                  24;
              }}
              onContentSizeChange={() => {
                if (
                  open &&
                  streaming &&
                  following.current &&
                  !dragging.current
                ) {
                  scrollRef.current?.scrollToEnd({ animated: !reduce });
                }
              }}
            >
              <View accessibilityLiveRegion="polite" style={styles.row}>
                <View style={{ width: gutterWidth }}>{gutter}</View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.flex}
                >
                  <View
                    style={{ minWidth: Math.max(0, viewport - gutterWidth) }}
                  >
                    {code}
                  </View>
                </ScrollView>
              </View>
            </ScrollView>
            {onCopy ? (
              <View style={styles.footer} className="px-2 pb-1.5 pt-1">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copied ? "Copied" : "Copy diff"}
                  hitSlop={8}
                  onPress={() => void copy()}
                  onPressIn={() => {
                    if (!reduce)
                      copyScale.value = withSpring(0.9, SPRING_PRESS);
                  }}
                  onPressOut={() => {
                    copyScale.value = withSpring(1, SPRING_PRESS);
                  }}
                >
                  <Animated.View style={[styles.copy, copyStyle]}>
                    {copied ? (
                      <CheckGlyph size={14} color={foreground} />
                    ) : (
                      <CopyGlyph size={14} color={muted} />
                    )}
                  </Animated.View>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Disclosure>
    </View>
  );
}

const styles = StyleSheet.create({
  // Scroll views shrink to fit the space above them; inside a closing
  // disclosure that would collapse the content to nothing.
  fixed: { flexGrow: 0, flexShrink: 0 },
  flex: { flex: 1 },
  row: { flexDirection: "row" },
  header: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 40 },
  counts: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusIcon: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  gutterRow: { flexDirection: "row", height: LINE, alignItems: "center" },
  number: {
    width: NUMBER,
    textAlign: "right",
    paddingRight: 8,
    lineHeight: LINE,
  },
  mark: { width: MARK, textAlign: "center", lineHeight: LINE },
  fold: { height: FOLD, justifyContent: "center" },
  foldGutter: { height: FOLD, alignItems: "center", justifyContent: "center" },
  footer: { flexDirection: "row", justifyContent: "flex-end" },
  copy: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabular: { fontVariant: ["tabular-nums"] },
});
