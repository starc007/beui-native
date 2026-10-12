import type { ComponentType } from "react";
import { AccordionShowcase } from "./accordion-showcase";
import { ButtonShowcase } from "./button-showcase";
import { CardShowcase } from "./card-showcase";
import { CheckboxShowcase } from "./checkbox-showcase";
import { InputShowcase } from "./input-showcase";
import { LoaderShowcase } from "./loader-showcase";
import { NumberShowcase } from "./number-showcase";
import { OTPShowcase } from "./otp-showcase";
import { RadioShowcase } from "./radio-showcase";
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
      },
      {
        slug: "text-animation",
        title: "Text Animation",
        description: "Reveals, sweeps, shimmers, cascades and scrambles.",
        Showcase: TextAnimationShowcase,
      },
      {
        slug: "loader",
        title: "Loader",
        description: "Seventeen indicators from one size prop.",
        Showcase: LoaderShowcase,
      },
    ],
  },
];

export const entries = groups.flatMap((group) => group.items);

export function findEntry(slug: string | undefined) {
  return entries.find((entry) => entry.slug === slug);
}
