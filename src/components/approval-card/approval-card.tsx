import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useResolveClassNames } from "uniwind";
import { usePresence } from "../../hooks/use-presence";
import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";
import {
  ArrowGlyph,
  CheckGlyph,
  CrossGlyph,
  HelpGlyph,
  MessageGlyph,
} from "../../primitives/agent-icons";
import { Disclosure } from "../../primitives/disclosure";
import type { IconProps } from "../../primitives/render-icon";
import { RollText } from "../../primitives/roll-text";
import { SpinGlyph } from "../../primitives/spin-glyph";
import { EASE_OUT, SPRING_SWAP } from "../../styles/motion";
import { Button } from "../button/button";
import { Checkbox } from "../checkbox/checkbox";
import { Input } from "../input/input";
import { RadioGroup, RadioGroupItem } from "../radio/radio";

export type ApprovalCardStatus =
  | "pending"
  | "submitting"
  | "approved"
  | "rejected"
  | "changes-requested"
  | "answered";

export type ApprovalCardOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type ApprovalCardQuestion = {
  id: string;
  title: string;
  description?: string;
  options?: ApprovalCardOption[];
  /** Checkboxes instead of radios. */
  multiple?: boolean;
  /** Moves on after a single choice. Defaults to true for single-choice questions. */
  autoAdvance?: boolean;
  /** Adds a free-text answer. With no options, the question is free text only. */
  allowCustom?: boolean;
  customPlaceholder?: string;
};

export type ApprovalCardAnswer = { selected: string[]; custom?: string };
export type ApprovalCardAnswers = Record<string, ApprovalCardAnswer>;

const EMPTY: ApprovalCardAnswer = { selected: [], custom: "" };
const ADVANCE_AFTER = 240;
const SWAP_IN = { duration: 200, easing: EASE_OUT };

const STATUS_LABEL: Record<ApprovalCardStatus, string> = {
  pending: "Input required",
  submitting: "Submitting",
  approved: "Approved",
  rejected: "Rejected",
  "changes-requested": "Changes requested",
  answered: "Response submitted",
};
const TONE: Record<ApprovalCardStatus, string> = {
  pending: "text-muted",
  submitting: "text-muted",
  approved: "text-success",
  answered: "text-success",
  rejected: "text-destructive",
  "changes-requested": "text-warning",
};
// Full class strings, so Uniwind can see every token at build time.
const BADGE_CLASS: Record<ApprovalCardStatus, string> = {
  pending: "border-warning/30 bg-warning/10",
  "changes-requested": "border-warning/30 bg-warning/10",
  submitting: "border-primary/30 bg-primary/10",
  approved: "border-success/30 bg-success/10",
  answered: "border-success/30 bg-success/10",
  rejected: "border-destructive/30 bg-destructive/10",
};
const BADGE_TEXT: Record<ApprovalCardStatus, string> = {
  pending: "text-warning",
  "changes-requested": "text-warning",
  submitting: "text-primary",
  approved: "text-success",
  answered: "text-success",
  rejected: "text-destructive",
};

const answered = (answer: ApprovalCardAnswer) =>
  answer.selected.length > 0 || Boolean(answer.custom?.trim());

function BusyIcon({ size, color }: IconProps) {
  const reduce = useReducedMotionPreference();
  return <SpinGlyph size={size} color={color} reduce={reduce} />;
}
function NextIcon({ size, color }: IconProps) {
  return <ArrowGlyph size={size} color={color} />;
}
function BackIcon({ size, color }: IconProps) {
  return <ArrowGlyph back size={size} color={color} />;
}

function Dot({
  index,
  current,
  reduce,
}: {
  index: number;
  current: number;
  reduce: boolean;
}) {
  const scale = useSharedValue(index === current ? 1 : 0.75);
  const opacity = useSharedValue(index <= current ? 1 : 0.35);
  useEffect(() => {
    const s = index === current ? 1 : 0.75;
    const o = index <= current ? 1 : 0.35;
    scale.value = reduce ? s : withSpring(s, SPRING_SWAP);
    opacity.value = reduce ? o : withSpring(o, SPRING_SWAP);
  }, [current, index, opacity, reduce, scale]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  return <Animated.View style={[styles.dot, style]} className="bg-primary" />;
}

const SLIDE = 24;
const SWIPE = 56;
const RESIST = 0.3;

/** Progress runs 0 (arriving) → 1 (resting) → 2 (leaving). */
function QuestionLayer({
  appear,
  exiting,
  direction,
  reduce,
  children,
}: {
  appear: boolean;
  exiting: boolean;
  direction: number;
  reduce: boolean;
  children: ReactNode;
}) {
  const progress = useSharedValue(appear && !reduce ? 0 : 1);
  useEffect(() => {
    progress.value = withTiming(
      exiting ? 2 : 1,
      reduce ? { duration: 0 } : SWAP_IN,
    );
  }, [exiting, progress, reduce]);
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p <= 1 ? p : 2 - p,
      // Arrives from the side you're heading toward; leaves out the other.
      transform: [{ translateX: reduce ? 0 : (1 - p) * SLIDE * direction }],
    };
  }, [direction, reduce]);
  return (
    <Animated.View
      pointerEvents={exiting ? "none" : "auto"}
      style={[exiting && styles.leaving, style]}
    >
      {children}
    </Animated.View>
  );
}

export type ApprovalCardProps = Omit<ViewProps, "children"> & {
  /** Defaults to "Approval required". Questions show their own titles. */
  title?: string;
  /** Review mode only. */
  description?: string;
  /** Review mode only: what's being approved, such as a summary of changes. */
  children?: ReactNode;
  /** Asks these one at a time. Without questions, the card asks for a review. */
  questions?: ApprovalCardQuestion[];
  /** Defaults to "pending". You move it forward after a decision. */
  status?: ApprovalCardStatus;
  answers?: ApprovalCardAnswers;
  defaultAnswers?: ApprovalCardAnswers;
  onAnswersChange?: (answers: ApprovalCardAnswers) => void;
  step?: number;
  /** Defaults to 0. */
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  /** Called with every answer after the last question. */
  onSubmit?: (answers: ApprovalCardAnswers) => void;
  onApprove?: () => void;
  /** Review mode: shows "Reject". */
  onReject?: () => void;
  /** Review mode: shows "Request changes". */
  onRequestChanges?: () => void;
  /** Shows a dismiss button. */
  onDismiss?: () => void;
  /** Defaults to "Approve". */
  approveLabel?: string;
  /** Defaults to "Submit response". */
  submitLabel?: string;
  /** Shown once decided, in place of the status label. */
  result?: string;
  className?: string;
  disableAnimation?: boolean;
};

/**
 * Asks a person to weigh in before an agent continues: a few questions one
 * at a time, or a review to approve. Once decided, it folds into the result.
 */
export function ApprovalCard({
  title = "Approval required",
  description,
  children,
  questions = [],
  status = "pending",
  answers: controlledAnswers,
  defaultAnswers = {},
  onAnswersChange,
  step: controlledStep,
  defaultStep = 0,
  onStepChange,
  onSubmit,
  onApprove,
  onReject,
  onRequestChanges,
  onDismiss,
  approveLabel = "Approve",
  submitLabel = "Submit response",
  result,
  className = "",
  disableAnimation = false,
  ...props
}: ApprovalCardProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const [internalAnswers, setInternalAnswers] = useState(defaultAnswers);
  const [internalStep, setInternalStep] = useState(defaultStep);
  const answers = controlledAnswers ?? internalAnswers;
  const hasQuestions = questions.length > 0;
  const step = Math.min(
    Math.max(controlledStep ?? internalStep, 0),
    Math.max(questions.length - 1, 0),
  );
  const question = hasQuestions ? questions[step] : undefined;
  const answer = (question && answers[question.id]) || EMPTY;
  const busy = status === "submitting";
  const interactive = status === "pending" || busy;
  const last = step === questions.length - 1;
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const { color: tone } = useResolveClassNames(TONE[status]);
  const { color: muted } = useResolveClassNames("text-muted");

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const direction = useRef(1);
  const drag = useSharedValue(0);
  const stage = usePresence(
    question?.id ?? null,
    question as ApprovalCardQuestion,
    () => (reduce ? 0 : SWAP_IN.duration + 40),
  );

  const setStep = (next: number) => {
    clearTimeout(advanceTimer.current);
    direction.current = next >= step ? 1 : -1;
    if (controlledStep === undefined) setInternalStep(next);
    onStepChange?.(next);
  };
  const setAnswer = (next: ApprovalCardAnswer) => {
    if (!question) return;
    const all = { ...answers, [question.id]: next };
    if (controlledAnswers === undefined) setInternalAnswers(all);
    onAnswersChange?.(all);
  };
  const advance = () => {
    if (!last) setStep(step + 1);
    else onSubmit?.(answers);
  };
  const queueAdvance = () => {
    if (
      !question ||
      question.multiple ||
      question.autoAdvance === false ||
      last ||
      busy
    )
      return;
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => setStep(step + 1), ADVANCE_AFTER);
  };

  const renderQuestion = (entry: ApprovalCardQuestion) => {
    const entryAnswer = answers[entry.id] ?? EMPTY;
    return (
      <>
        {entry.description ? (
          <Text className="mt-1 text-sm leading-5 text-muted">
            {entry.description}
          </Text>
        ) : null}
        <View className="mt-3">
          {entry.options?.length ? (
            entry.multiple ? (
              <View className="gap-0.5">
                {entry.options.map((option) => (
                  <Checkbox
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    disabled={busy || option.disabled}
                    checked={entryAnswer.selected.includes(option.value)}
                    onCheckedChange={(checked) =>
                      setAnswer({
                        selected: checked
                          ? [...entryAnswer.selected, option.value]
                          : entryAnswer.selected.filter(
                              (value) => value !== option.value,
                            ),
                        custom: entryAnswer.custom,
                      })
                    }
                    className="min-h-9 rounded-lg px-1.5 py-1"
                  />
                ))}
              </View>
            ) : (
              <RadioGroup
                value={entryAnswer.selected[0] ?? ""}
                onValueChange={(value) => {
                  setAnswer({ selected: [value], custom: "" });
                  queueAdvance();
                }}
                className="gap-0.5"
              >
                {entry.options.map((option) => (
                  <RadioGroupItem
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    description={option.description}
                    disabled={busy || option.disabled}
                    className="min-h-9 rounded-lg px-1.5 py-1"
                  />
                ))}
              </RadioGroup>
            )
          ) : null}
          {entry.allowCustom ? (
            <Input
              value={entryAnswer.custom ?? ""}
              onChangeText={(custom) =>
                setAnswer({
                  selected: entry.multiple ? entryAnswer.selected : [],
                  custom,
                })
              }
              placeholder={entry.customPlaceholder ?? "Add another response…"}
              accessibilityLabel={entry.customPlaceholder ?? "Another response"}
              disabled={busy}
              returnKeyType={last ? "send" : "next"}
              onSubmitEditing={() => {
                if (answered(answer)) advance();
              }}
              className={entry.options?.length ? "mt-1.5" : ""}
              classNames={{
                field: "h-11 rounded-xl border-0 bg-background/70",
                input: "px-3 text-sm",
              }}
            />
          ) : null}
        </View>
      </>
    );
  };

  const canForward = !busy && !last && answered(answer);
  const canBack = !busy && step > 0;
  const goForward = () => setStep(step + 1);
  const goBack = () => setStep(step - 1);
  // Swipe left for the next question, right for the previous one. A swipe
  // that can't go anywhere pulls with resistance and springs back.
  const swipe = Gesture.Pan()
    .enabled(questions.length > 1)
    .activeOffsetX([-16, 16])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      const allowed = event.translationX < 0 ? canForward : canBack;
      drag.value = event.translationX * (allowed ? 0.5 : RESIST * 0.5);
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE && canForward) scheduleOnRN(goForward);
      else if (event.translationX > SWIPE && canBack) scheduleOnRN(goBack);
      drag.value = withSpring(0, SPRING_SWAP);
    });
  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value }],
  }));

  const statusIcon = busy ? (
    <SpinGlyph size={16} color={tone} reduce={reduce} />
  ) : interactive ? (
    hasQuestions ? (
      <HelpGlyph size={16} color={tone} />
    ) : (
      <MessageGlyph size={16} color={tone} />
    )
  ) : status === "rejected" ? (
    <CrossGlyph size={16} color={tone} />
  ) : (
    <CheckGlyph size={16} color={tone} />
  );

  return (
    <View
      accessibilityState={{ busy }}
      className={`w-full overflow-hidden rounded-2xl bg-surface p-4 ${className}`}
      {...props}
    >
      <View style={styles.layout}>
        <View style={styles.icon}>{statusIcon}</View>
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <View style={styles.flex} accessibilityRole="header">
              <RollText
                value={question?.id ?? status}
                text={question?.title ?? title}
                className="text-base font-medium leading-5 text-foreground"
                reduce={reduce}
                numberOfLines={0}
              />
            </View>
            {hasQuestions && interactive ? (
              questions.length > 1 ? (
                <Text
                  accessibilityLabel={`Question ${step + 1} of ${questions.length}`}
                  className="text-xs text-muted/70"
                  style={styles.tabular}
                >
                  {step + 1}/{questions.length}
                </Text>
              ) : null
            ) : (
              <View
                accessibilityLiveRegion="polite"
                className={`rounded-full border px-2 py-0.5 ${BADGE_CLASS[status]}`}
              >
                <Text
                  className={`text-[11px] font-medium ${BADGE_TEXT[status]}`}
                >
                  {STATUS_LABEL[status]}
                </Text>
              </View>
            )}
            {onDismiss ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss"
                hitSlop={12}
                onPress={onDismiss}
              >
                <CrossGlyph size={16} color={muted} />
              </Pressable>
            ) : null}
          </View>

          <Disclosure open={interactive} reduce={reduce}>
            {question ? (
              <View>
                <GestureDetector gesture={swipe}>
                  <Animated.View style={dragStyle}>
                    {stage.map((item) => (
                      <QuestionLayer
                        key={item.key}
                        appear={item.appear}
                        exiting={item.exiting}
                        direction={direction.current}
                        reduce={reduce}
                      >
                        {renderQuestion(item.value)}
                      </QuestionLayer>
                    ))}
                  </Animated.View>
                </GestureDetector>
                <View style={styles.footer} className="mt-4">
                  {questions.length > 1 ? (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        icon={BackIcon}
                        accessibilityLabel="Previous question"
                        disabled={step === 0 || busy}
                        onPress={() => setStep(step - 1)}
                        className="rounded-full"
                      />
                      <View
                        accessible
                        accessibilityLabel={`Question ${step + 1} of ${questions.length}`}
                        style={styles.dots}
                      >
                        {questions.map((entry, index) => (
                          <Dot
                            key={entry.id}
                            index={index}
                            current={step}
                            reduce={reduce}
                          />
                        ))}
                      </View>
                    </>
                  ) : null}
                  <View style={styles.next}>
                    {last ? (
                      <Button
                        size="sm"
                        endIcon={busy ? BusyIcon : NextIcon}
                        disabled={busy || !answered(answer)}
                        onPress={advance}
                        className="rounded-full"
                      >
                        {submitLabel}
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        icon={NextIcon}
                        accessibilityLabel="Next question"
                        disabled={busy || !answered(answer)}
                        onPress={advance}
                        className="rounded-full"
                      />
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View>
                {description ? (
                  <Text className="mt-1 text-sm leading-5 text-muted">
                    {description}
                  </Text>
                ) : null}
                {children ? <View className="mt-3">{children}</View> : null}
                <View style={styles.review} className="mt-4">
                  <Button
                    size="sm"
                    disabled={busy}
                    onPress={onApprove}
                    className="rounded-full"
                  >
                    {approveLabel}
                  </Button>
                  {onRequestChanges ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onPress={onRequestChanges}
                      className="rounded-full"
                    >
                      Request changes
                    </Button>
                  ) : null}
                  {onReject ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onPress={onReject}
                      className="rounded-full"
                    >
                      Reject
                    </Button>
                  ) : null}
                </View>
              </View>
            )}
          </Disclosure>
          {!interactive ? (
            <Text className="mt-1 text-sm text-muted">
              {result ?? STATUS_LABEL[status]}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  layout: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  icon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  footer: { flexDirection: "row", alignItems: "center", gap: 12 },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  next: { marginLeft: "auto" },
  review: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  tabular: { fontVariant: ["tabular-nums"] },
  leaving: { position: "absolute", left: 0, right: 0, top: 0 },
});
