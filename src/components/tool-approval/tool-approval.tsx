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
import { EASE_OUT, SPRING_PRESS, SPRING_SWAP } from "../../styles/motion";

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
const BADGE_CLASS: Record<ToolApprovalStatus, string> = {
  pending: "border-warning/30 bg-warning/10",
  approving: "border-primary/30 bg-primary/10",
  running: "border-primary/30 bg-primary/10",
  approved: "border-success/30 bg-success/10",
  complete: "border-success/30 bg-success/10",
  denied: "border-destructive/30 bg-destructive/10",
  error: "border-destructive/30 bg-destructive/10",
};
const BADGE_TEXT: Record<ToolApprovalStatus, string> = {
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
        className={`rounded-xl px-3.5 ${className}`}
      >
        <Text className={`text-xs font-medium ${textClassName}`}>{label}</Text>
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
        className={`overflow-hidden rounded-xl px-3.5 ${className}`}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.fill, fillStyle]}
          className={fillClassName}
        />
        {/* The widest label holds the width, so neighbours never shift. */}
        <View>
          <Text className={`text-xs font-medium opacity-0 ${textClassName}`}>
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
              className={`text-xs font-medium ${textClassName}`}
              reduce={reduce}
            />
          </View>
        </View>
      </Animated.View>
    </Pressable>
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
  /** Controlled details state. */
  open?: boolean;
  /** Defaults to false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onApprove?: () => void;
  /** Shows "Always allow". */
  onAlwaysAllow?: () => void;
  onDeny?: () => void;
  /**
   * How allowing is confirmed. "hold" (the default) needs a press and hold,
   * so a stray tap can't run a tool; "tap" allows on a tap.
   */
  confirm?: "hold" | "tap";
  /** Milliseconds to hold. Defaults to 600. */
  holdDuration?: number;
  className?: string;
  /** Swaps states without motion, independently of the system preference. */
  disableAnimation?: boolean;
};

/**
 * Asks before an agent runs a tool. The details fold away and the actions
 * leave once you decide, and the status follows the run to its result.
 */
export function ToolApproval({
  tool,
  title = "Allow this tool to run?",
  description,
  parameters = [],
  status = "pending",
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onApprove,
  onAlwaysAllow,
  onDeny,
  confirm = "hold",
  holdDuration = 600,
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
  const previous = useRef(status);
  const turn = useSharedValue(open ? 1 : 0);
  const { color: muted } = useResolveClassNames("text-muted");
  const { color: destructive } = useResolveClassNames("text-destructive");

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
    <SpinGlyph size={16} color={muted} reduce={reduce} />
  ) : status === "error" ? (
    <AlertGlyph size={16} color={destructive} />
  ) : status === "denied" ? (
    <CrossGlyph size={16} color={muted} />
  ) : status === "approved" || status === "complete" ? (
    <CheckGlyph size={16} color={muted} />
  ) : (
    <ShieldGlyph size={16} color={muted} />
  );

  return (
    <View
      accessibilityState={{ busy }}
      className={`w-full overflow-hidden rounded-2xl border border-border bg-surface/50 ${className}`}
      {...props}
    >
      <View style={styles.header} className="p-4">
        <View
          style={styles.tile}
          className="rounded-xl border border-border bg-background"
        >
          {icon}
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.flex}>
              <Text className="text-sm font-medium text-foreground">
                {title}
              </Text>
              <Text
                numberOfLines={1}
                className="mt-0.5 font-mono text-xs text-muted"
              >
                {tool}
              </Text>
            </View>
            <View
              accessibilityLiveRegion="polite"
              className={`rounded-full border px-2 py-0.5 ${BADGE_CLASS[status]}`}
            >
              <Text className={`text-[11px] font-medium ${BADGE_TEXT[status]}`}>
                {STATUS_LABEL[status]}
              </Text>
            </View>
          </View>
          {description ? (
            <Text className="mt-2 text-sm leading-5 text-muted">
              {description}
            </Text>
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
                View details
              </Text>
              <Animated.View style={chevronStyle}>
                <ChevronDownGlyph size={14} color={muted} />
              </Animated.View>
            </Pressable>
          ) : null}
        </View>
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
      <Disclosure open={pending} reduce={reduce}>
        <View
          style={styles.actions}
          className="border-t border-border px-4 py-3"
        >
          {confirm === "hold" ? (
            <>
              <HoldButton
                label="Allow once"
                className="bg-foreground"
                textClassName="text-background"
                fillClassName="bg-background/25"
                duration={holdDuration}
                reduce={reduce}
                onConfirm={onApprove}
              />
              {onAlwaysAllow ? (
                <HoldButton
                  label="Always allow"
                  className="border border-border bg-background"
                  textClassName="text-foreground"
                  fillClassName="bg-foreground/10"
                  duration={holdDuration}
                  reduce={reduce}
                  onConfirm={onAlwaysAllow}
                />
              ) : null}
            </>
          ) : (
            <>
              <ActionButton
                label="Allow once"
                className="bg-foreground"
                textClassName="text-background"
                reduce={reduce}
                onPress={onApprove}
              />
              {onAlwaysAllow ? (
                <ActionButton
                  label="Always allow"
                  className="border border-border bg-background"
                  textClassName="text-foreground"
                  reduce={reduce}
                  onPress={onAlwaysAllow}
                />
              ) : null}
            </>
          )}
          <ActionButton
            label="Deny"
            className=""
            textClassName="text-muted"
            reduce={reduce}
            onPress={onDeny}
          />
        </View>
      </Disclosure>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  tile: {
    width: 32,
    height: 32,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  details: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  // Label above value: a phone is too narrow for a label column beside code.
  parameter: { gap: 4 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  action: { minHeight: 36, justifyContent: "center" },
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
});
