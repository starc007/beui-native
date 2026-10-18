import { useEffect, useState } from "react";
import {
  type PromptAction,
  type PromptAttachment,
  PromptInput,
  type PromptModel,
} from "../../src";
import { DemoSection, DemoStatus } from "./demo";
import {
  AttachIcon,
  BrainIcon,
  FileIcon,
  FlashIcon,
  ImageIcon,
  SparklesIcon,
} from "./icons";

const MODELS: PromptModel[] = [
  {
    value: "balanced",
    label: "Balanced",
    description: "Quick, thoughtful answers",
    icon: SparklesIcon,
  },
  {
    value: "fast",
    label: "Fast",
    description: "For everyday questions",
    icon: FlashIcon,
  },
  {
    value: "deep",
    label: "Deep reasoning",
    description: "Takes longer on hard problems",
    icon: BrainIcon,
  },
];

const ACTIONS: PromptAction[] = [
  { value: "image", label: "Add photos", icon: ImageIcon },
  { value: "file", label: "Add files", icon: AttachIcon },
  { value: "skill", label: "Use a skill", icon: SparklesIcon },
];

const SAMPLES: Record<string, PromptAttachment> = {
  image: { id: "image", label: "export-menu.png", icon: ImageIcon },
  file: { id: "file", label: "release-notes.md", icon: FileIcon },
};

export function PromptInputShowcase() {
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<PromptAttachment[]>([]);
  const [note, setNote] = useState(
    "Type a prompt, or tap + for files and models.",
  );

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      setNote("Reply finished.");
    }, 2400);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <>
      <DemoSection
        title="Composer"
        description="A pill while it's one line, with a mic until you type. Keep typing and it opens into a card with the buttons underneath. Send turns into stop while the reply streams."
      >
        <DemoStatus>{note}</DemoStatus>
        <PromptInput
          models={MODELS}
          actions={ACTIONS}
          attachments={attachments}
          onRemoveAttachment={(id) =>
            setAttachments((current) =>
              current.filter((item) => item.id !== id),
            )
          }
          loading={loading}
          onVoice={() => setNote("Voice: start dictation here.")}
          onSubmit={(value, model) => {
            setLoading(true);
            setAttachments([]);
            const label =
              MODELS.find((entry) => entry.value === model)?.label ?? "";
            setNote(
              value
                ? `Sent to ${label}: “${value}”`
                : `Sent the attachments to ${label}.`,
            );
          }}
          onStop={() => {
            setLoading(false);
            setNote("Stopped. Your prompt is back in the field.");
          }}
          onAction={(action) => {
            const sample = SAMPLES[action];
            if (sample) {
              setAttachments((current) =>
                current.some((item) => item.id === sample.id)
                  ? current
                  : [...current, sample],
              );
            }
            setNote(
              `${ACTIONS.find((entry) => entry.value === action)?.label ?? action}.`,
            );
          }}
          onModelChange={(model) =>
            setNote(
              `Model: ${MODELS.find((entry) => entry.value === model)?.label ?? model}.`,
            )
          }
        />
      </DemoSection>
      <DemoSection
        title="Long prompts"
        description="A prompt that wraps opens the composer into a card."
      >
        <PromptInput
          defaultValue="Draft release notes for the new export menu. Keep it to three short bullets, mention the keyboard shortcut, and end with a line about what's next."
          actions={ACTIONS}
          onSubmit={() => {}}
        />
      </DemoSection>
    </>
  );
}
