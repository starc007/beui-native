import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useResolveClassNames } from "uniwind";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import {
  AlertGlyph,
  CheckGlyph,
  ChevronDownGlyph,
  CrossGlyph,
  ShieldGlyph,
} from "../../primitives/agent-icons";
import { Disclosure } from "../../primitives/disclosure";
import { RollText } from "../../primitives/roll-text";
import { SpinGlyph } from "../../primitives/spin-glyph";
import {
  EASE_IN_OUT,
  EASE_OUT,
  SPRING_PRESS,
  SPRING_SWAP,
} from "../../styles/motion";

export type ToolApprovalStatus =
  | "pending"
  | "approving"
  | "approved"
  | "denied"
  | "running"
  | "complete"
  | "error";

export type ToolApprovalParameter = {
  id: string;
  label: string;
  value: ReactNode;
};

const STATUS_LABEL: Record<ToolApprovalStatus, string> = {
  pending: "Approval required",
  approving: "Approving",
  approved: "Approved",
  denied: "Denied",
  running: "Running",
  complete: "Completed",
  error: "Failed",
};

// Full class strings, so Uniwind can see every token at build time.
const STATUS_TEXT: Record<ToolApprovalStatus, string> = {
  pending: "text-warning",
  approving: "text-primary",
  running: "text-primary",
  approved: "text-success",
  complete: "text-success",
  denied: "text-destructive",
  error: "text-destructive",
};

export type ToolApprovalCodeProps = { code: string; className?: string };

/** A command or snippet in a parameter value, set in monospace. */
export function ToolApprovalCode({
  code,
  className = "",
}: ToolApprovalCodeProps) {
  return (
    <View
      className={`rounded-lg border border-border bg-surface px-2.5 py-2 ${className}`}
    >
      <Text className="font-mono text-xs leading-5 text-foreground/85">
        {code}
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  className,
  textClassName,
  reduce,
  onPress,
}: {
  label: string;
  className: string;
  textClassName: string;
  reduce: boolean;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        if (!reduce) scale.value = withSpring(0.97, SPRING_PRESS);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_PRESS);
      }}
    >
      <Animated.View
        style={[styles.action, style]}
        className={`rounded-xl px-4 ${className}`}
      >
        <Text className={`text-sm font-semibold ${textClassName}`}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const HOLD_DRAIN = { duration: 220, easing: EASE_OUT };

/**
 * A button that confirms only after a press and hold, so a stray thumb can't
 * approve a tool run. A fill sweeps across while held and drains back if let
 * go early. Screen readers activate it with a double tap.
 */
function HoldButton({
  label,
  className,
  textClassName,
  fillClassName,
  duration,
  reduce,
  onConfirm,
}: {
  label: string;
  className: string;
  textClassName: string;
  fillClassName: string;
  duration: number;
  reduce: boolean;
  onConfirm?: () => void;
}) {
  const progress = useSharedValue(0);
  // The label coaches the gesture: "Keep holding…" while pressed, and
  // "Hold to allow" after a tap that let go too soon.
  const [phase, setPhase] = useState<"idle" | "holding" | "short">("idle");
  const shortTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(shortTimer.current), []);
  const scale = useSharedValue(1);
  const confirmed = useRef(false);

  const confirm = () => {
    if (confirmed.current) return;
    confirmed.current = true;
    onConfirm?.();
  };

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Press and hold to confirm"
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={confirm}
      onPressIn={() => {
        confirmed.current = false;
        clearTimeout(shortTimer.current);
        setPhase("holding");
        if (!reduce) scale.value = withSpring(0.97, SPRING_PRESS);
        progress.value = withTiming(
          1,
          { duration, easing: Easing.linear },
          (finished) => {
            if (finished) scheduleOnRN(confirm);
          },
        );
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_PRESS);
        if (confirmed.current) {
          setPhase("idle");
          return;
        }
        cancelAnimation(progress);
        progress.value = withTiming(0, HOLD_DRAIN);
        setPhase("short");
        shortTimer.current = setTimeout(() => setPhase("idle"), 1600);
      }}
    >
      <Animated.View
        style={[styles.action, pressStyle]}
        className={`overflow-hidden rounded-xl px-4 ${className}`}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.fill, fillStyle]}
          className={fillClassName}
        />
        {/* The widest label holds the width, so neighbours never shift. */}
        <View>
          <Text className={`text-sm font-semibold opacity-0 ${textClassName}`}>
            {label.length > "Keep holding…".length ? label : "Keep holding…"}
          </Text>
          <View style={styles.labelLayer}>
            <RollText
              value={phase}
              text={
                phase === "holding"
                  ? "Keep holding…"
                  : phase === "short"
                    ? "Hold to allow"
                    : label
              }
              className={`text-sm font-semibold ${textClassName}`}
              reduce={reduce}
            />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export type ToolApprovalRisk = "low" | "normal" | "high";

/**
 * A thin bar that slides along the bottom edge while the tool runs.
 */
function RunningBar({ reduce }: { reduce: boolean }) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  useEffect(() => {
    if (reduce || width === 0) return;
    x.value = 0;
    x.value = withRepeat(
      withTiming(1, { duration: 1200, easing: EASE_IN_OUT }),
      -1,
      false,
    );
    return () => cancelAnimation(x);
  }, [reduce, width, x]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -width * 0.35 + x.value * width * 1.35 }],
  }));
  return (
    <View
      pointerEvents="none"
      style={styles.bar}
      onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
    >
      {reduce ? (
        <View style={StyleSheet.absoluteFill} className="bg-primary/40" />
      ) : (
        <Animated.View style={[styles.barFill, style]} className="bg-primary" />
      )}
    </View>
  );
}

export type ToolApprovalProps = Omit<ViewProps, "children"> & {
  /** The tool's name, such as `terminal.run`. */
  tool: string;
  /** Defaults to "Allow this tool to run?". */
  title?: string;
  description?: string;
  /** What the tool will be called with, behind "View details". */
  parameters?: ToolApprovalParameter[];
  /** Defaults to "pending". You move it forward as the run progresses. */
  status?: ToolApprovalStatus;
  /**
   * How careful allowing should be. "low" allows on a tap; "normal" (the
   * default) needs a press and hold; "high" needs a longer hold, tints the
   * card and says why in `riskNote`.
   */
  risk?: ToolApprovalRisk;
  /** Why a high-risk tool deserves a second look, such as "Deletes files". */
  riskNote?: string;
  /** What happened, shown once the run ends, such as "49 tests passed in 2.1s". */
  result?: string;
  /** Controlled details state. */
  open?: boolean;
  /** Defaults to false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onApprove?: () => void;
  /** Shows "Always allow". */
  onAlwaysAllow?: () => void;
  onDeny?: () => void;
  /** Overrides how allowing is confirmed; by default it follows `risk`. */
  confirm?: "hold" | "tap";
  /** Milliseconds to hold. Defaults to 600, or 900 for high risk. */
  holdDuration?: number;
  className?: string;
  /** Swaps states without motion, independently of the system preference. */
  disableAnimation?: boolean;
};

/**
 * Asks before an agent runs a tool, then follows the run to its result in
 * the same card. Allowing takes a press and hold unless the tool is low risk.
 */
export function ToolApproval({
  tool,
  title = "Allow this tool to run?",
  description,
  parameters = [],
  status = "pending",
  risk = "normal",
  riskNote,
  result,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onApprove,
  onAlwaysAllow,
  onDeny,
  confirm,
  holdDuration,
  className = "",
  disableAnimation = false,
  ...props
}: ToolApprovalProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const pending = status === "pending";
  const busy = status === "approving" || status === "running";
  const ended =
    status === "complete" || status === "error" || status === "denied";
  const high = risk === "high";
  const confirmBy = confirm ?? (risk === "low" ? "tap" : "hold");
  const hold = holdDuration ?? (high ? 900 : 600);
  const previous = useRef(status);
  const turn = useSharedValue(open ? 1 : 0);
  const { color: muted } = useResolveClassNames("text-muted");
  const { color: tone } = useResolveClassNames(STATUS_TONE[status]);

  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  // Folds the details once a decision is made.
  useEffect(() => {
    const was = previous.current;
    previous.current = status;
    if (was === "pending" && status !== "pending") setOpen(false);
  });

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

  const icon = busy ? (
    <SpinGlyph size={14} color={tone} reduce={reduce} />
  ) : status === "error" ? (
    <AlertGlyph size={14} color={tone} />
  ) : status === "denied" ? (
    <CrossGlyph size={14} color={tone} />
  ) : status === "approved" || status === "complete" ? (
    <CheckGlyph size={14} color={tone} />
  ) : high ? (
    <AlertGlyph size={14} color={tone} />
  ) : (
    <ShieldGlyph size={14} color={tone} />
  );

  const allowClass = high ? "bg-destructive" : "bg-primary";
  const allowText = high ? "text-background" : "text-on-primary";
  const allow =
    confirmBy === "hold" ? (
      <HoldButton
        label="Allow once"
        className={allowClass}
        textClassName={allowText}
        fillClassName="bg-background/25"
        duration={hold}
        reduce={reduce}
        onConfirm={onApprove}
      />
    ) : (
      <ActionButton
        label="Allow once"
        className={allowClass}
        textClassName={allowText}
        reduce={reduce}
        onPress={onApprove}
      />
    );
  const always = onAlwaysAllow ? (
    confirmBy === "hold" ? (
      <HoldButton
        label="Always allow"
        className="border border-border-strong bg-background"
        textClassName="text-foreground"
        fillClassName="bg-foreground/10"
        duration={hold}
        reduce={reduce}
        onConfirm={onAlwaysAllow}
      />
    ) : (
      <ActionButton
        label="Always allow"
        className="border border-border-strong bg-background"
        textClassName="text-foreground"
        reduce={reduce}
        onPress={onAlwaysAllow}
      />
    )
  ) : null;

  return (
    <View
      accessibilityState={{ busy }}
      className={`w-full overflow-hidden rounded-2xl border ${high && pending ? "border-destructive/30 bg-destructive/5" : "border-border bg-surface/50"} ${className}`}
      {...props}
    >
      <View className="gap-2 p-4">
        {/* The tool and where the run is, on one quiet line. */}
        <View accessibilityLiveRegion="polite" style={styles.meta}>
          <View style={styles.metaIcon}>{icon}</View>
          <Text
            numberOfLines={1}
            className="shrink font-mono text-xs text-muted"
          >
            {tool}
          </Text>
          <View style={styles.spacer} />
          <RollText
            text={STATUS_LABEL[status]}
            className={`text-xs font-medium ${STATUS_TEXT[status]}`}
            reduce={reduce}
          />
        </View>
        <Text className="text-base font-semibold leading-6 text-foreground">
          {title}
        </Text>
        {description ? (
          <Text className="text-sm leading-5 text-muted">{description}</Text>
        ) : null}
        {high && riskNote && pending ? (
          <View
            style={styles.note}
            className="rounded-lg bg-destructive/10 px-3 py-2"
          >
            <AlertGlyph size={14} color={tone} />
            <Text className="flex-1 text-xs font-medium leading-4 text-destructive">
              {riskNote}
            </Text>
          </View>
        ) : null}
        {parameters.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            onPress={() => setOpen(!open)}
            hitSlop={10}
            style={styles.details}
          >
            <Text className="text-xs font-medium text-muted">
              {open ? "Hide details" : "View details"}
            </Text>
            <Animated.View style={chevronStyle}>
              <ChevronDownGlyph size={14} color={muted} />
            </Animated.View>
          </Pressable>
        ) : null}
      </View>
      {parameters.length > 0 ? (
        <Disclosure open={open} reduce={reduce}>
          <View className="mx-4 mb-4 gap-3 rounded-xl border border-border bg-background/70 p-3">
            {parameters.map((parameter) => (
              <View key={parameter.id} style={styles.parameter}>
                <Text className="text-xs text-muted">{parameter.label}</Text>
                <View>
                  {typeof parameter.value === "string" ? (
                    <Text className="font-mono text-xs text-foreground/85">
                      {parameter.value}
                    </Text>
                  ) : (
                    parameter.value
                  )}
                </View>
              </View>
            ))}
          </View>
        </Disclosure>
      ) : null}
      {/* The run's outcome, in the card that asked for it. */}
      <Disclosure open={ended && Boolean(result)} reduce={reduce}>
        <View
          style={styles.result}
          className={`mx-4 mb-4 rounded-xl px-3 py-2.5 ${RESULT_CLASS[status]}`}
        >
          <Text className={`text-sm leading-5 ${RESULT_TEXT[status]}`}>
            {result}
          </Text>
        </View>
      </Disclosure>
      <Disclosure open={pending} reduce={reduce}>
        {/* Thumb-sized: the main action spans the card, the others share a row. */}
        <View className="gap-2 border-t border-border p-4">
          {allow}
          <View style={styles.secondary}>
            {always ? <View style={styles.flex}>{always}</View> : null}
            <View style={styles.flex}>
              <ActionButton
                label="Deny"
                className="bg-foreground/5"
                textClassName="text-foreground"
                reduce={reduce}
                onPress={onDeny}
              />
            </View>
          </View>
        </View>
      </Disclosure>
      {busy ? <RunningBar reduce={reduce} /> : null}
    </View>
  );
}

const STATUS_TONE: Record<ToolApprovalStatus, string> = {
  pending: "text-muted",
  approving: "text-primary",
  running: "text-primary",
  approved: "text-success",
  complete: "text-success",
  denied: "text-muted",
  error: "text-destructive",
};
// Denied isn't a failure, so its note stays neutral.
const RESULT_TEXT: Record<ToolApprovalStatus, string> = {
  pending: "text-foreground",
  approving: "text-foreground",
  running: "text-foreground",
  approved: "text-success",
  complete: "text-success",
  denied: "text-foreground/80",
  error: "text-destructive",
};
const RESULT_CLASS: Record<ToolApprovalStatus, string> = {
  pending: "",
  approving: "",
  running: "",
  approved: "bg-success/10",
  complete: "bg-success/10",
  denied: "bg-foreground/5",
  error: "bg-destructive/10",
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  spacer: { flex: 1 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 20 },
  metaIcon: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  note: { flexDirection: "row", alignItems: "center", gap: 8 },
  details: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  // Label above value: a phone is too narrow for a label column beside code.
  parameter: { gap: 4 },
  result: { flexDirection: "row" },
  secondary: { flexDirection: "row", gap: 8 },
  action: { minHeight: 46, alignItems: "center", justifyContent: "center" },
  fill: { transformOrigin: ["0%", "50%", 0] },
  labelLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    overflow: "hidden",
  },
  barFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "35%",
    borderRadius: 1,
  },
});
