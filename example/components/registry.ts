import type { ComponentType } from "react";
import { AccordionShowcase } from "./accordion-showcase";
import { AlertShowcase } from "./alert-showcase";
import { BadgeShowcase } from "./badge-showcase";
import { ButtonShowcase } from "./button-showcase";
import { CardShowcase } from "./card-showcase";
import { CheckboxShowcase } from "./checkbox-showcase";
import { InputShowcase } from "./input-showcase";
import { LoaderShowcase } from "./loader-showcase";
import { NumberShowcase } from "./number-showcase";
import { OTPShowcase } from "./otp-showcase";
import { RadioShowcase } from "./radio-showcase";
import { RangeSliderShowcase } from "./range-slider-showcase";
import { SelectShowcase } from "./select-showcase";
import { SwipeShowcase } from "./swipe-showcase";
import { SwitchShowcase } from "./switch-showcase";
import { TabsShowcase } from "./tabs-showcase";
import { TextAnimationShowcase } from "./text-animation-showcase";

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
        variants: 3,
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
