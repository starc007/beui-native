import { useState } from "react";
import { BouncyAccordion, type BouncyAccordionItem } from "../../src";
import { DemoSection } from "./demo";
import {
  CalendarIcon,
  FileIcon,
  FolderIcon,
  MegaphoneIcon,
  PackageIcon,
  ShieldIcon,
} from "./icons";

const FAQ: BouncyAccordionItem[] = [
  {
    id: "what",
    title: "What is beUI Native?",
    description:
      "Animated React Native components ported from beUI, built with Reanimated, Gesture Handler and Uniwind.",
  },
  {
    id: "expo",
    title: "Does it work in Expo Go?",
    description:
      "Yes. Every component uses libraries that ship in Expo Go, so you can try them without a development build.",
  },
  {
    id: "copy",
    title: "How do I add a component to my app?",
    description:
      "Copy the component's folder and the shared hooks and primitives it lists, then add the theme tokens. There is no package to install yet.",
  },
  {
    id: "motion",
    title: "What happens with reduced motion?",
    description:
      "Every component checks the system setting. Springs and slides become instant or gentle fades, and nothing essential relies on motion.",
  },
  {
    id: "icons",
    title: "Which icon library should I use?",
    description:
      "Any. Components take an icon component that receives a size and color, so Hugeicons, Lucide or your own SVGs all work.",
  },
];

const RELEASE: BouncyAccordionItem[] = [
  {
    id: "brief",
    title: "Release brief",
    icon: FileIcon,
    description:
      "Collect launch notes, owners and risks in one compact handoff before the release window opens.",
  },
  {
    id: "launch",
    title: "Launch checklist",
    icon: ShieldIcon,
    description:
      "Verify copy, links, analytics, rollback steps and final approvals without leaving the queue.",
  },
  {
    id: "campaign",
    title: "Campaign notes",
    icon: MegaphoneIcon,
    description:
      "Keep channel-specific notes close to the task while the collapsed list stays calm.",
  },
  {
    id: "calendar",
    title: "Rollout calendar",
    icon: CalendarIcon,
    description:
      "Plan announcements, staging checks, reminders and quiet periods on one timeline.",
  },
  {
    id: "ship",
    title: "Ship build",
    icon: PackageIcon,
    description:
      "Track the current artifact, deploy status and final sign-off before marking the release complete.",
  },
  {
    id: "archive",
    title: "Archive assets",
    icon: FolderIcon,
    description:
      "Move final copy, images and source files into the campaign folder once the rollout is done.",
  },
];

export function AccordionShowcase() {
  const [faq, setFaq] = useState<string | null>("expo");

  return (
    <>
      <DemoSection
        title="FAQ"
        description="Open a question and it springs apart from the rest."
      >
        <BouncyAccordion items={FAQ} value={faq} onValueChange={setFaq} />
      </DemoSection>
      <DemoSection
        title="With icons"
        description="Rows can lead with an icon. This one always keeps one open."
      >
        <BouncyAccordion
          items={RELEASE}
          defaultValue="calendar"
          collapsible={false}
        />
      </DemoSection>
    </>
  );
}
