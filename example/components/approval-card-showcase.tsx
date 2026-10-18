import { useState } from "react";
import { Text, View } from "react-native";
import {
  ApprovalCard,
  type ApprovalCardQuestion,
  type ApprovalCardStatus,
  Button,
} from "../../src";
import { DemoSection } from "./demo";

const QUESTIONS: ApprovalCardQuestion[] = [
  {
    id: "scope",
    title: "How focused should the first release be?",
    options: [
      {
        value: "focused",
        label: "A focused starter set",
        description: "Ship a few polished pieces first.",
      },
      {
        value: "broad",
        label: "A broader collection",
        description: "Cover more ground with lighter depth.",
      },
      {
        value: "flagship",
        label: "One flagship experience",
        description: "Pour everything into a single showcase.",
      },
    ],
    allowCustom: true,
    customPlaceholder: "Describe another scope…",
  },
  {
    id: "checks",
    title: "Which checks should block publishing?",
    description:
      "Select every check the agent must pass before it can continue.",
    multiple: true,
    options: [
      { value: "types", label: "Type safety" },
      { value: "accessibility", label: "Accessibility" },
      { value: "registry", label: "Registry validation" },
    ],
  },
  {
    id: "preserve",
    title: "Anything the agent should preserve?",
    allowCustom: true,
    customPlaceholder: "Add a final constraint…",
  },
];

const RESULTS: Partial<Record<ApprovalCardStatus, string>> = {
  approved: "Publishing was approved.",
  "changes-requested": "The agent will wait for revision notes.",
  rejected: "Publishing was declined.",
};

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View className="flex-row justify-between gap-4 py-1">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className={`text-xs text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </Text>
    </View>
  );
}

export function ApprovalCardShowcase() {
  const [questions, setQuestions] = useState(0);
  const [questionStatus, setQuestionStatus] =
    useState<ApprovalCardStatus>("pending");
  const [review, setReview] = useState<ApprovalCardStatus>("pending");

  const decide = (final: ApprovalCardStatus) => {
    setReview("submitting");
    setTimeout(() => setReview(final), 700);
  };

  return (
    <>
      <DemoSection
        title="Questions"
        description="One question at a time. A single choice moves on by itself; swipe left or right to move between questions."
      >
        <ApprovalCard
          key={questions}
          questions={QUESTIONS}
          status={questionStatus}
          result="Three responses sent to the agent."
          onSubmit={() => {
            setQuestionStatus("submitting");
            setTimeout(() => setQuestionStatus("answered"), 750);
          }}
        />
        <Button
          className="self-center"
          size="sm"
          variant="ghost"
          disabled={questionStatus === "pending"}
          onPress={() => {
            setQuestionStatus("pending");
            setQuestions((n) => n + 1);
          }}
        >
          Replay
        </Button>
      </DemoSection>
      <DemoSection
        title="Review"
        description="Approve, ask for changes or reject a prepared release."
      >
        <ApprovalCard
          title="Publish the component update?"
          description="The agent has prepared the release and is waiting for your decision."
          status={review}
          result={RESULTS[review]}
          onApprove={() => decide("approved")}
          onRequestChanges={() => decide("changes-requested")}
          onReject={() => decide("rejected")}
        >
          <View className="gap-1">
            <Row label="Release" value="approval-card" mono />
            <Row label="Checks" value="4 passed" />
            <Row label="Visibility" value="Public registry" />
          </View>
        </ApprovalCard>
        <Button
          className="self-center"
          size="sm"
          variant="ghost"
          disabled={review === "pending"}
          onPress={() => setReview("pending")}
        >
          Replay
        </Button>
      </DemoSection>
    </>
  );
}
