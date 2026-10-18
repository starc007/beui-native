import { useEffect, useState } from "react";
import { type PromptAction, PromptInput, type PromptModel } from "../../src";
import { DemoSection, DemoStatus } from "./demo";
import {
  AttachIcon,
  BrainIcon,
  FlashIcon,
  ImageIcon,
  SparklesIcon,
} from "./icons";

const MODELS: PromptModel[] = [
  { value: "balanced", label: "Balanced", icon: SparklesIcon },
  { value: "fast", label: "Fast", icon: FlashIcon },
  { value: "deep", label: "Deep reasoning", icon: BrainIcon },
];

const ACTIONS: PromptAction[] = [
  {
    value: "image",
    label: "Attach image",
    description: "From your photos or camera",
    icon: ImageIcon,
  },
  {
    value: "file",
    label: "Attach file",
    description: "PDFs, docs and code",
    icon: AttachIcon,
  },
  {
    value: "skill",
    label: "Use a skill",
    description: "Reusable instructions",
    icon: SparklesIcon,
  },
];

export function PromptInputShowcase() {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("Type a prompt and send it.");

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      setNote("Reply finished.");
    }, 2400);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <DemoSection
      title="Composer"
      description="The field grows as you type. Send turns into stop while the reply streams."
    >
      <DemoStatus>{note}</DemoStatus>
      <PromptInput
        models={MODELS}
        actions={ACTIONS}
        defaultValue="Draft release notes for the new export menu"
        loading={loading}
        onSubmit={(value, model) => {
          setLoading(true);
          const label =
            MODELS.find((entry) => entry.value === model)?.label ?? "";
          setNote(`Sent to ${label}: “${value}”`);
        }}
        onStop={() => {
          setLoading(false);
          setNote("Stopped.");
        }}
        onAction={(action) =>
          setNote(
            `${ACTIONS.find((entry) => entry.value === action)?.label ?? action} chosen.`,
          )
        }
        onModelChange={(model) =>
          setNote(
            `Model: ${MODELS.find((entry) => entry.value === model)?.label ?? model}.`,
          )
        }
      />
    </DemoSection>
  );
}
