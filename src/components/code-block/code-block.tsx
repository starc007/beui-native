import { type ReactNode, useEffect, useRef, useState } from "react";
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
  CopyGlyph,
  FileGlyph,
  WrapGlyph,
} from "../../primitives/agent-icons";
import {
  type CodeLanguage,
  type CodeToken,
  useCodeTokens,
} from "../../primitives/code-tokens";
import { SpinGlyph } from "../../primitives/spin-glyph";
import { SPRING_PRESS } from "../../styles/motion";

export type CodeBlockStatus = "streaming" | "complete";

const LINE = 20;
const GUTTER = 44;
const COPIED_FOR = 1600;

/** One line of tokens as nested Text, so colors stay on the line's baseline. */
export function CodeLineText({
  tokens,
  wrap,
  className = "",
}: {
  tokens: CodeToken[];
  wrap?: boolean;
  className?: string;
}) {
  return (
    <Text
      numberOfLines={wrap ? undefined : 1}
      className={`font-mono text-xs text-foreground/85 ${className}`}
      style={styles.line}
    >
      {tokens.length === 0
        ? " "
        : tokens.map((token, index) => (
            <Text
              key={index}
              style={token.color ? { color: token.color } : undefined}
            >
              {token.content}
            </Text>
          ))}
    </Text>
  );
}

function IconButton({
  label,
  selected,
  reduce,
  onPress,
  children,
}: {
  label: string;
  selected?: boolean;
  reduce: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      hitSlop={8}
      onPress={onPress}
      onPressIn={() => {
        if (!reduce) scale.value = withSpring(0.9, SPRING_PRESS);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_PRESS);
      }}
    >
      <Animated.View style={[styles.iconButton, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export type CodeBlockProps = Omit<ViewProps, "children"> & {
  code: string;
  /** Defaults to "typescript". */
  language?: CodeLanguage;
  filename?: string;
  /** Defaults to "complete". While streaming, the view follows new lines. */
  status?: CodeBlockStatus;
  /** Defaults to true. */
  showLineNumbers?: boolean;
  /** 1-based lines to tint. */
  highlightLines?: number[];
  /** Tallest the code grows before it scrolls. Defaults to 280. */
  maxHeight?: number;
  /** Starts wrapped. The header has a toggle either way. Defaults to false. */
  wrap?: boolean;
  /** Shows a copy button. Copy with your clipboard library here. */
  onCopy?: () => unknown;
  className?: string;
  disableAnimation?: boolean;
};

/**
 * Highlighted code that streams in line by line. Line numbers stay put while
 * long lines scroll sideways, and a tap wraps them instead.
 */
export function CodeBlock({
  code,
  language = "typescript",
  filename,
  status = "complete",
  showLineNumbers = true,
  highlightLines = [],
  maxHeight = 280,
  wrap: initialWrap = false,
  onCopy,
  className = "",
  disableAnimation = false,
  ...props
}: CodeBlockProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const streaming = status === "streaming";
  const lines = useCodeTokens(code, language);
  const [wrap, setWrap] = useState(initialWrap);
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState(0);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const scrollRef = useRef<ScrollView>(null);
  const following = useRef(true);
  const dragging = useRef(false);
  const highlighted = new Set(highlightLines);
  const { color: muted } = useResolveClassNames("text-muted");
  const { color: foreground } = useResolveClassNames("text-foreground");
  const { color: primary } = useResolveClassNames("text-primary");
  const { color: success } = useResolveClassNames("text-success");

  useEffect(() => {
    if (streaming) following.current = true;
  }, [streaming]);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const copy = async () => {
    await onCopy?.();
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_FOR);
  };

  const tint = (index: number) =>
    highlighted.has(index + 1) ? "bg-primary/10" : "";

  const gutter = showLineNumbers ? (
    <View style={{ width: GUTTER }}>
      {lines.map((_, index) => (
        <View key={index} style={styles.gutterRow} className={tint(index)}>
          <Text
            className="font-mono text-xs text-muted/50"
            style={[styles.line, styles.tabular]}
          >
            {index + 1}
          </Text>
        </View>
      ))}
    </View>
  ) : null;

  return (
    <View
      accessibilityState={{ busy: streaming }}
      className={`w-full overflow-hidden rounded-2xl bg-surface ${className}`}
      {...props}
    >
      <View style={styles.header} className="px-3">
        <FileGlyph size={14} color={muted} />
        {filename ? (
          <Text
            numberOfLines={1}
            className="shrink font-mono text-xs text-foreground/80"
          >
            {filename}
          </Text>
        ) : null}
        <Text
          className="text-[10px] font-medium uppercase text-muted/70"
          style={styles.tracking}
        >
          {language}
        </Text>
        <View accessibilityLiveRegion="polite" style={styles.status}>
          {streaming ? (
            <SpinGlyph size={12} color={primary} reduce={reduce} />
          ) : (
            <CheckGlyph size={12} color={success} />
          )}
          <Text
            className={`text-[10px] font-medium ${streaming ? "text-primary" : "text-success"}`}
          >
            {streaming ? "Writing" : "Ready"}
          </Text>
        </View>
        <IconButton
          label="Wrap lines"
          selected={wrap}
          reduce={reduce}
          onPress={() => setWrap((value) => !value)}
        >
          <WrapGlyph size={14} color={wrap ? foreground : muted} />
        </IconButton>
        {onCopy ? (
          <IconButton
            label={copied ? "Copied" : "Copy code"}
            reduce={reduce}
            onPress={() => void copy()}
          >
            {copied ? (
              <CheckGlyph size={14} color={foreground} />
            ) : (
              <CopyGlyph size={14} color={muted} />
            )}
          </IconButton>
        ) : null}
      </View>
      <ScrollView
        ref={scrollRef}
        style={{ maxHeight }}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        className="border-t border-foreground/5"
        contentContainerClassName="py-2"
        scrollEventThrottle={32}
        onLayout={({ nativeEvent }) => setViewport(nativeEvent.layout.width)}
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
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          following.current =
            contentSize.height - contentOffset.y - layoutMeasurement.height <
            24;
        }}
        onContentSizeChange={() => {
          if (streaming && following.current && !dragging.current) {
            scrollRef.current?.scrollToEnd({ animated: !reduce });
          }
        }}
      >
        <View accessibilityLiveRegion={streaming ? "polite" : "none"}>
          {wrap ? (
            // Wrapped lines vary in height, so each row carries its own number.
            lines.map((tokens, index) => (
              <View key={index} style={styles.row} className={tint(index)}>
                {showLineNumbers ? (
                  <Text
                    className="font-mono text-xs text-muted/50"
                    style={[styles.line, styles.tabular, styles.number]}
                  >
                    {index + 1}
                  </Text>
                ) : null}
                <CodeLineText
                  tokens={tokens}
                  wrap
                  className={`flex-1 pr-4 ${showLineNumbers ? "pl-1" : "pl-4"}`}
                />
              </View>
            ))
          ) : (
            <View style={styles.row}>
              {gutter}
              {/* Only the code scrolls sideways; the numbers stay in place. */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.flex}
              >
                <View
                  style={{
                    minWidth: Math.max(
                      0,
                      viewport - (showLineNumbers ? GUTTER : 0),
                    ),
                  }}
                >
                  {lines.map((tokens, index) => (
                    <View
                      key={index}
                      className={`${tint(index)} ${showLineNumbers ? "pl-1" : "pl-4"} pr-4`}
                    >
                      <CodeLineText tokens={tokens} />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, height: 44 },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  line: { lineHeight: LINE, minHeight: LINE },
  gutterRow: { height: LINE, alignItems: "flex-end", paddingRight: 12 },
  number: { width: GUTTER, textAlign: "right", paddingRight: 12 },
  row: { flexDirection: "row" },
  tabular: { fontVariant: ["tabular-nums"] },
  tracking: { letterSpacing: 0.4 },
});
