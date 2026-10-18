import { type ReactNode, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import {
  CheckGlyph,
  FileGlyph,
  GlobeGlyph,
  ImageGlyph,
  MessageGlyph,
  PencilGlyph,
  SearchGlyph,
  SparkleGlyph,
  TerminalGlyph,
  WrenchGlyph,
} from "../../primitives/agent-icons";
import { RiseIn } from "../../primitives/rise-in";
import type {
  AgentActivityItem,
  AgentActivitySearch,
  AgentActivityStep,
  AgentActivityTool,
  AgentActivityTrace,
  AgentSearchResult,
} from "./types";

/** Plain strings take the given text style; other nodes render as they are. */
export function textOf(node: ReactNode, className: string, lines?: number) {
  return typeof node === "string" || typeof node === "number" ? (
    <Text numberOfLines={lines} className={className}>
      {node}
    </Text>
  ) : (
    node
  );
}

function useMuted() {
  return useResolveClassNames("text-muted").color;
}

function Halo({ reduce }: { reduce: boolean }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (reduce) {
      cancelAnimation(pulse);
      pulse.value = 0.5;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 750, reduceMotion: ReduceMotion.Never }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse, reduce]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.45,
  }));
  return (
    <View style={styles.active}>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.halo, style]}
        className="bg-foreground/10"
      />
      <View style={styles.dot} className="bg-foreground/60" />
    </View>
  );
}

function StepRow({
  item,
  reduce,
}: {
  item: AgentActivityStep;
  reduce: boolean;
}) {
  const muted = useMuted();
  const status = item.status ?? "complete";
  return (
    <View style={styles.stepRow} className="rounded-md px-1.5 py-1">
      <View style={styles.stepIcon}>
        {status === "complete" ? (
          <CheckGlyph size={16} color={muted} strokeWidth={1.8} />
        ) : status === "active" ? (
          <Halo reduce={reduce} />
        ) : (
          <View style={styles.pending} className="border-muted" />
        )}
      </View>
      <View style={styles.flex}>
        {textOf(
          item.label,
          `text-sm leading-5 ${status === "pending" ? "text-muted/60" : "text-foreground"}`,
        )}
      </View>
      {item.meta ? textOf(item.meta, "text-sm leading-5 text-muted/60") : null}
    </View>
  );
}

function ResultRow({
  result,
  reduce,
  onOpenResult,
}: {
  result: AgentSearchResult;
  reduce: boolean;
  onOpenResult?: (result: AgentSearchResult) => void;
}) {
  const muted = useMuted();
  const content = (
    <>
      <View style={styles.resultIcon}>
        {result.icon ?? <GlobeGlyph size={12} color={muted} />}
      </View>
      <View style={styles.resultText}>
        {textOf(result.title, "shrink text-sm font-medium text-foreground", 1)}
        {result.domain
          ? textOf(result.domain, "shrink text-sm text-muted/60", 1)
          : null}
      </View>
    </>
  );
  return (
    <RiseIn reduce={reduce}>
      {result.url && onOpenResult ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => onOpenResult(result)}
          style={styles.resultRow}
          className="rounded-md px-1.5 py-1 active:bg-surface"
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.resultRow} className="px-1.5 py-1">
          {content}
        </View>
      )}
    </RiseIn>
  );
}

function SearchRow({
  item,
  reduce,
  onOpenResult,
}: {
  item: AgentActivitySearch;
  reduce: boolean;
  onOpenResult?: (result: AgentSearchResult) => void;
}) {
  const muted = useMuted();
  return (
    <View style={styles.gap}>
      <View style={styles.queryRow} className="px-1.5 py-1">
        <SearchGlyph size={16} color={muted} strokeWidth={1.7} />
        {textOf(item.query, "shrink text-sm text-muted", 1)}
      </View>
      <View style={[styles.gap, styles.results]}>
        {item.results?.map((result) => (
          <ResultRow
            key={result.id}
            result={result}
            reduce={reduce}
            onOpenResult={onOpenResult}
          />
        ))}
        {item.moreCount ? (
          <RiseIn reduce={reduce}>
            <Text className="py-1 pl-8 text-sm text-muted/60">
              +{item.moreCount} more
            </Text>
          </RiseIn>
        ) : null}
      </View>
    </View>
  );
}

function toolIcon(action: string, color: unknown) {
  const props = { size: 16, color: color as string };
  if (action === "read") return <FileGlyph {...props} />;
  if (action === "edit" || action === "write")
    return <PencilGlyph {...props} />;
  if (action === "run") return <TerminalGlyph {...props} />;
  return <WrenchGlyph {...props} />;
}

function Chip({ children, grow }: { children: ReactNode; grow?: boolean }) {
  return (
    <View
      style={grow ? styles.flex : styles.shrink}
      className="rounded-lg bg-surface px-2.5 py-1"
    >
      {textOf(children, "font-mono text-xs text-muted", 1)}
    </View>
  );
}

function ToolRow({ item }: { item: AgentActivityTool }) {
  const muted = useMuted();
  const label = item.action.charAt(0).toUpperCase() + item.action.slice(1);
  return (
    <View style={styles.toolRow} className="px-1.5 py-0.5">
      {toolIcon(item.action, muted)}
      <Text className="text-sm font-medium leading-5 text-foreground">
        {label}
      </Text>
      <Chip grow>{item.target}</Chip>
      {item.additions !== undefined || item.deletions !== undefined ? (
        <View style={styles.counts}>
          {item.additions !== undefined ? (
            <Text
              className="font-mono text-xs text-success"
              style={styles.tabular}
            >
              +{item.additions}
            </Text>
          ) : null}
          {item.deletions !== undefined ? (
            <Text
              className="font-mono text-xs text-destructive"
              style={styles.tabular}
            >
              −{item.deletions}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function traceIcon(kind: string, color: unknown) {
  const props = { size: 16, color: color as string };
  if (kind === "thinking") return <SparkleGlyph {...props} />;
  if (kind === "message") return <MessageGlyph {...props} />;
  if (kind === "write") return <PencilGlyph {...props} />;
  if (kind === "run") return <TerminalGlyph {...props} />;
  if (kind === "read") return <ImageGlyph {...props} />;
  return <WrenchGlyph {...props} />;
}

function TraceRow({ item }: { item: AgentActivityTrace }) {
  const muted = useMuted();
  return (
    <View style={styles.toolRow} className="px-1.5 py-0.5">
      {item.icon ?? traceIcon(item.kind, muted)}
      {textOf(item.label, "text-sm font-medium leading-5 text-foreground")}
      {item.detail ? <Chip>{item.detail}</Chip> : null}
    </View>
  );
}

export function ActivityRow({
  item,
  reduce,
  onOpenResult,
}: {
  item: AgentActivityItem;
  reduce: boolean;
  onOpenResult?: (result: AgentSearchResult) => void;
}) {
  switch (item.type) {
    case "step":
      return <StepRow item={item} reduce={reduce} />;
    case "text":
      return textOf(
        item.content,
        "rounded-md px-1.5 py-1 text-sm leading-5 text-muted",
      );
    case "search":
      return (
        <SearchRow item={item} reduce={reduce} onOpenResult={onOpenResult} />
      );
    case "tool":
      return <ToolRow item={item} />;
    case "trace":
      return <TraceRow item={item} />;
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1, minWidth: 0 },
  gap: { gap: 2 },
  results: { paddingLeft: 16 },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minHeight: 28,
  },
  stepIcon: {
    width: 16,
    height: 16,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  active: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: { borderRadius: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pending: { width: 11, height: 11, borderRadius: 6, borderWidth: 1.5 },
  queryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 28,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 28,
  },
  resultIcon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  resultText: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 32,
  },
  counts: { flexDirection: "row", alignItems: "center", gap: 8 },
  tabular: { fontVariant: ["tabular-nums"] },
});
