import type { ComponentType } from "react";
import { AccordionShowcase } from "./accordion-showcase";
import { AgentActivityShowcase } from "./agent-activity-showcase";
import { AlertShowcase } from "./alert-showcase";
import { ApprovalCardShowcase } from "./approval-card-showcase";
import { BadgeShowcase } from "./badge-showcase";
import { ButtonShowcase } from "./button-showcase";
import { CardShowcase } from "./card-showcase";
import { CheckboxShowcase } from "./checkbox-showcase";
import { CitationsShowcase } from "./citations-showcase";
import { CodeBlockShowcase } from "./code-block-showcase";
import { ColorPickerShowcase } from "./color-picker-showcase";
import { ExpandableShowcase } from "./expandable-showcase";
import { FileDiffShowcase } from "./file-diff-showcase";
import { ImageGenerationShowcase } from "./image-generation-showcase";
import { InputShowcase } from "./input-showcase";
import { LoaderShowcase } from "./loader-showcase";
import { LoadingStatesShowcase } from "./loading-states-showcase";
import { MenuShowcase } from "./menu-showcase";
import { MessageBubbleShowcase } from "./message-bubble-showcase";
import { MessageScrollerShowcase } from "./message-scroller-showcase";
import { MessageShowcase } from "./message-showcase";
import { MorphingModalShowcase } from "./morphing-modal-showcase";
import { MultiSelectShowcase } from "./multi-select-showcase";
import { NumberShowcase } from "./number-showcase";
import { OTPShowcase } from "./otp-showcase";
import { PromptInputShowcase } from "./prompt-input-showcase";
import { RadioShowcase } from "./radio-showcase";
import { RangeSliderShowcase } from "./range-slider-showcase";
import { SelectShowcase } from "./select-showcase";
import { StreamingResponseShowcase } from "./streaming-response-showcase";
import { SwipeShowcase } from "./swipe-showcase";
import { SwitchShowcase } from "./switch-showcase";
import { TabsShowcase } from "./tabs-showcase";
import { TextAnimationShowcase } from "./text-animation-showcase";
import { TodoListShowcase } from "./todo-list-showcase";
import { ToolApprovalShowcase } from "./tool-approval-showcase";
import { ToolResultShowcase } from "./tool-result-showcase";
import { VoiceOrbShowcase } from "./voice-orb-showcase";

export type ComponentEntry = {
  /** Route segment, matching the beui.dev slug where one exists. */
  slug: string;
  title: string;
  description: string;
  Showcase: ComponentType;
  /** Shows previous, next and done controls above the keyboard. */
  keyboard?: boolean;
  /** Distinct animations the entry ships, when more than one. Colors don't count. */
  variants?: number;
  /** ISO date the entry reached beui.dev, which marks it New there for a week. */
  launchedAt?: string;
};

export type ComponentGroup = { title: string; items: ComponentEntry[] };

export const groups: ComponentGroup[] = [
  {
    title: "Actions",
    items: [
      {
        slug: "button",
        title: "Button",
        description: "Spring press, ripple, icons and a stateful variant.",
        Showcase: ButtonShowcase,
        variants: 2,
      },
      {
        slug: "expandable-control",
        title: "Expandable Control",
        description: "Buttons and chips that spring open to reveal more.",
        Showcase: ExpandableShowcase,
      },
      {
        slug: "menu",
        launchedAt: "2026-10-18",
        title: "Menu",
        description:
          "A pull-down menu with submenus you can slide a finger through.",
        Showcase: MenuShowcase,
      },
      {
        slug: "card",
        title: "Card",
        description: "Composable surfaces, selectable with press feedback.",
        Showcase: CardShowcase,
      },
    ],
  },
  {
    title: "Forms",
    items: [
      {
        slug: "input",
        title: "Input",
        description: "Error shake, focus ring and a drawn success check.",
        Showcase: InputShowcase,
        keyboard: true,
      },
      {
        slug: "otp-input",
        title: "OTP Input",
        description: "Digits roll into slots, with SMS autofill.",
        Showcase: OTPShowcase,
        keyboard: true,
      },
      {
        slug: "select",
        title: "Select",
        description: "A panel that unfolds out of its trigger.",
        Showcase: SelectShowcase,
      },
      {
        slug: "multi-select",
        title: "Multi Select",
        description: "Searchable options that become removable chips.",
        Showcase: MultiSelectShowcase,
      },
      {
        slug: "color-picker",
        title: "Color Picker",
        description: "A popover picker with a loupe under your finger.",
        Showcase: ColorPickerShowcase,
      },
      {
        slug: "checkbox",
        title: "Checkbox",
        description: "A checkmark that draws itself in.",
        Showcase: CheckboxShowcase,
      },
      {
        slug: "radio",
        title: "Radio Group",
        description: "One dot glides to the option you pick.",
        Showcase: RadioShowcase,
      },
      {
        slug: "range-slider",
        title: "Range Slider",
        description: "A bar thumb that glides between steps.",
        Showcase: RangeSliderShowcase,
      },
      {
        slug: "switch",
        title: "Switch",
        description: "A weighty thumb that squishes and stretches.",
        Showcase: SwitchShowcase,
      },
    ],
  },
  {
    title: "Navigation and lists",
    items: [
      {
        slug: "bouncy-accordion",
        title: "Bouncy Accordion",
        description: "FAQ rows that spring apart as they open.",
        Showcase: AccordionShowcase,
      },
      {
        slug: "tabs",
        title: "Tabs",
        description: "Pill, segment and underline with a gliding indicator.",
        Showcase: TabsShowcase,
        variants: 4,
      },
      {
        slug: "swipeable-list",
        title: "Swipeable List",
        description: "Rows that swipe to reveal actions.",
        Showcase: SwipeShowcase,
      },
    ],
  },
  {
    title: "Motion",
    items: [
      {
        slug: "number",
        title: "Number Animation",
        description: "Rolling tickers and count-ups.",
        Showcase: NumberShowcase,
        variants: 2,
      },
      {
        slug: "text-animation",
        title: "Text Animation",
        description: "Reveals, sweeps, shimmers, cascades and scrambles.",
        Showcase: TextAnimationShowcase,
        variants: 5,
      },
      {
        slug: "alert",
        title: "Alert",
        description: "Feedback that eases in and folds away.",
        Showcase: AlertShowcase,
      },
      {
        slug: "animated-badge",
        title: "Animated Badge",
        description: "Status pills whose icon and label roll.",
        Showcase: BadgeShowcase,
      },
      {
        slug: "loader",
        title: "Loader",
        description: "Seventeen indicators from one size prop.",
        Showcase: LoaderShowcase,
        variants: 17,
      },
      {
        slug: "morphing-modal",
        title: "Morphing Modal",
        description:
          "A card that springs to the size of each view you open in it.",
        Showcase: MorphingModalShowcase,
      },
    ],
  },
  {
    title: "AI agents",
    items: [
      {
        slug: "message",
        launchedAt: "2026-10-18",
        title: "Message",
        description:
          "Rows that rise out of their corner, with avatars and typing dots.",
        Showcase: MessageShowcase,
      },
      {
        slug: "message-bubble",
        launchedAt: "2026-10-18",
        title: "Message Bubble",
        description:
          "Six surfaces that pop from their corner, and a show more.",
        Showcase: MessageBubbleShowcase,
        variants: 2,
      },
      {
        slug: "message-scroller",
        launchedAt: "2026-10-18",
        title: "Message Scroller",
        description: "Follows new output and lets go when you scroll up.",
        Showcase: MessageScrollerShowcase,
        keyboard: true,
      },
      {
        slug: "prompt-input",
        launchedAt: "2026-10-18",
        title: "Prompt Input",
        description: "A chat composer with attachments, voice and stop.",
        Showcase: PromptInputShowcase,
        keyboard: true,
      },
      {
        slug: "streaming-response",
        launchedAt: "2026-10-18",
        title: "Streaming Response",
        description: "A reply that streams in, then settles with actions.",
        Showcase: StreamingResponseShowcase,
      },
      {
        slug: "loading-states",
        launchedAt: "2026-10-18",
        title: "Agent Loading States",
        description: "Shimmers, cycling reasoning text and a progress timer.",
        Showcase: LoadingStatesShowcase,
        variants: 3,
      },
      {
        slug: "agent-activity",
        launchedAt: "2026-10-18",
        title: "Agent Activity",
        description: "Steps, searches and tool calls in one live log.",
        Showcase: AgentActivityShowcase,
        variants: 5,
      },
      {
        slug: "todo-list",
        launchedAt: "2026-10-18",
        title: "Todo List",
        description: "A plan whose marks morph as tasks finish.",
        Showcase: TodoListShowcase,
      },
      {
        slug: "tool-approval",
        launchedAt: "2026-10-18",
        title: "Tool Approval",
        description: "Hold to let an agent run a tool.",
        Showcase: ToolApprovalShowcase,
      },
      {
        slug: "approval-card",
        launchedAt: "2026-10-18",
        title: "Approval Card",
        description: "Swipeable questions, or a review to approve.",
        Showcase: ApprovalCardShowcase,
        keyboard: true,
        variants: 2,
      },
      {
        slug: "tool-result",
        launchedAt: "2026-10-18",
        title: "Tool Result",
        description: "Output that streams in, then folds into a result.",
        Showcase: ToolResultShowcase,
        variants: 2,
      },
      {
        slug: "citations",
        launchedAt: "2026-10-18",
        title: "Citations",
        description: "Tap a number and its source springs up.",
        Showcase: CitationsShowcase,
      },
      {
        slug: "code-block",
        launchedAt: "2026-10-18",
        title: "Code Block",
        description: "Streaming code with fixed line numbers and wrap.",
        Showcase: CodeBlockShowcase,
      },
      {
        slug: "file-diff",
        launchedAt: "2026-10-18",
        title: "File Diff",
        description: "Changes with live counts and folded context.",
        Showcase: FileDiffShowcase,
      },
      {
        slug: "image-generation",
        launchedAt: "2026-10-18",
        title: "Image Generation",
        description: "A dot field you can steer while the image forms.",
        Showcase: ImageGenerationShowcase,
      },
      {
        slug: "voice-orb",
        launchedAt: "2026-10-18",
        title: "Voice Orb",
        description: "A liquid sphere that moves with your voice.",
        Showcase: VoiceOrbShowcase,
      },
    ],
  },
];

export const entries = groups.flatMap((group) => group.items);

/** Every animated component and variant, for the home screen's count. */
export const variantCount = entries.reduce(
  (total, entry) => total + (entry.variants ?? 1),
  0,
);

export function findEntry(slug: string | undefined) {
  return entries.find((entry) => entry.slug === slug);
}
