# beUI Native

Animated, accessible components for React Native, built for touch. A native companion to [beUI](https://beui.dev): the same component APIs and motion language, rebuilt for phones with Reanimated, Gesture Handler and Uniwind.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/beui-native.svg?label=cli)](https://www.npmjs.com/package/beui-native)
![Expo SDK 57](https://img.shields.io/badge/Expo%20SDK-57-000020.svg)
![React Native 0.86](https://img.shields.io/badge/React%20Native-0.86-61dafb.svg)
![Platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey.svg)

**[Components](https://beui.dev/react-native)** · **[Setup guide](https://beui.dev/docs/native-setup)** · **[Try in Expo Go](#try-it-on-your-phone)** · **[CLI](cli/README.md)**

<table>
  <tr>
    <td align="center"><a href="https://beui.dev/react-native/tabs"><picture><source media="(prefers-color-scheme: dark)" srcset="https://media.beui.dev/clips/tabs-dark.368c58debc.jpg" /><img alt="Tabs on iOS" src="https://media.beui.dev/clips/tabs-light.dde453bfa1.jpg" width="180" /></picture></a><br /><sub>Tabs</sub></td>
    <td align="center"><a href="https://beui.dev/react-native/color-picker"><picture><source media="(prefers-color-scheme: dark)" srcset="https://media.beui.dev/clips/color-picker-dark.14d23a1a36.jpg" /><img alt="Color Picker on iOS" src="https://media.beui.dev/clips/color-picker-light.30675dbd04.jpg" width="180" /></picture></a><br /><sub>Color Picker</sub></td>
    <td align="center"><a href="https://beui.dev/react-native/alert"><picture><source media="(prefers-color-scheme: dark)" srcset="https://media.beui.dev/clips/alert-dark.9d416affc2.jpg" /><img alt="Alert on iOS" src="https://media.beui.dev/clips/alert-light.ff37d25947.jpg" width="180" /></picture></a><br /><sub>Alert</sub></td>
    <td align="center"><a href="https://beui.dev/react-native/swipeable-list"><picture><source media="(prefers-color-scheme: dark)" srcset="https://media.beui.dev/clips/swipeable-list-dark.93379a92fd.jpg" /><img alt="Swipeable List on iOS" src="https://media.beui.dev/clips/swipeable-list-light.70546afcf5.jpg" width="180" /></picture></a><br /><sub>Swipeable List</sub></td>
  </tr>
</table>

Like beUI on the web, beUI Native isn't a dependency. You copy each component's source into your app and own it, by hand or with the CLI. Every component has a page on [beui.dev](https://beui.dev/react-native) with a recording, install steps and its docs, and a README here covering its API, motion and accessibility.

## Quick start

1. Do the [one-time setup](https://beui.dev/docs/native-setup) in your Expo or React Native app: Reanimated, Gesture Handler, Uniwind and the theme tokens.
2. Add a component from your app's root:

   ```sh
   npx beui-native add tabs
   ```

   It copies the component and the shared files it needs into `src/`, and installs any libraries your app is missing.
3. Use it:

   ```tsx
   import { Tabs, TabsContent, TabsList, TabsTrigger } from "./src/components/tabs";

   <Tabs defaultValue="overview">
     <TabsList>
       <TabsTrigger value="overview">Overview</TabsTrigger>
       <TabsTrigger value="activity">Activity</TabsTrigger>
     </TabsList>
     <TabsContent value="overview">…</TabsContent>
     <TabsContent value="activity">…</TabsContent>
   </Tabs>
   ```

## Components

Each name opens the component's page on beui.dev, with a recording from iOS and install steps.

| Component | What it does | Docs |
| --- | --- | --- |
| **Actions** | | |
| [Button](https://beui.dev/react-native/button) | Spring press, ripple, icons, and a stateful variant for async actions. | [README](src/components/button/README.md) |
| [Expandable Control](https://beui.dev/react-native/expandable-control) | Buttons and chips that spring open to reveal a label or an action. | [README](src/components/expandable-control/README.md) |
| [Menu](https://beui.dev/react-native/menu) | A pull-down menu you can slide a finger through. | [README](src/components/menu/README.md) |
| [Card](https://beui.dev/react-native/card) | Composable surfaces, selectable with press feedback. | [README](src/components/card/README.md) |
| **Forms** | | |
| [Input](https://beui.dev/react-native/input) | Error shake, focus ring and a drawn success check. | [README](src/components/input/README.md) |
| [OTP Input](https://beui.dev/react-native/otp-input) | Digits roll into slots, with SMS autofill. | [README](src/components/otp-input/README.md) |
| [Select](https://beui.dev/react-native/select) | A panel that unfolds out of its trigger. | [README](src/components/select/README.md) |
| [Multi Select](https://beui.dev/react-native/multi-select) | Searchable options that become removable chips. | [README](src/components/multi-select/README.md) |
| [Color Picker](https://beui.dev/react-native/color-picker) | A popover picker with a loupe under your finger. | [README](src/components/color-picker/README.md) |
| [Checkbox](https://beui.dev/react-native/checkbox) | A checkmark that draws itself in. | [README](src/components/checkbox/README.md) |
| [Radio Group](https://beui.dev/react-native/radio) | One dot glides to the option you pick. | [README](src/components/radio/README.md) |
| [Range Slider](https://beui.dev/react-native/range-slider) | A bar thumb that glides between steps. | [README](src/components/range-slider/README.md) |
| [Switch](https://beui.dev/react-native/switch) | A weighty thumb that squishes and stretches. | [README](src/components/switch/README.md) |
| **Navigation and lists** | | |
| [Bouncy Accordion](https://beui.dev/react-native/bouncy-accordion) | FAQ rows that spring apart as they open. | [README](src/components/bouncy-accordion/README.md) |
| [Tabs](https://beui.dev/react-native/tabs) | Pill, segment and underline tabs with a gliding indicator. | [README](src/components/tabs/README.md) |
| [Swipeable List](https://beui.dev/react-native/swipeable-list) | Rows that swipe to reveal actions. | [README](src/components/swipeable-list/README.md) |
| **Motion and feedback** | | |
| [Number Animation](https://beui.dev/react-native/number) | Rolling tickers and count-ups. | [README](src/components/number/README.md) |
| [Text Animation](https://beui.dev/react-native/text-animation) | Reveals, sweeps, shimmers, cascades and scrambles. | [README](src/components/text-animation/README.md) |
| [Alert](https://beui.dev/react-native/alert) | Feedback that eases in and folds away. | [README](src/components/alert/README.md) |
| [Animated Badge](https://beui.dev/react-native/animated-badge) | Status pills whose icon and label roll. | [README](src/components/animated-badge/README.md) |
| [Loader](https://beui.dev/react-native/loader) | Seventeen loading indicators from one size prop. | [README](src/components/loader/README.md) |
| **AI agents** | | |
| [Message](https://beui.dev/react-native/message) | Rows that rise out of their corner, with avatars and typing dots. | [README](src/components/message/README.md) |
| [Message Bubble](https://beui.dev/react-native/message-bubble) | Six surfaces that pop from their corner, and a show more. | [README](src/components/message-bubble/README.md) |
| [Message Scroller](https://beui.dev/react-native/message-scroller) | Follows new output and lets go when you scroll up. | [README](src/components/message-scroller/README.md) |
| [Prompt Input](https://beui.dev/react-native/prompt-input) | A chat composer with attachments, voice and stop. | [README](src/components/prompt-input/README.md) |
| [Streaming Response](https://beui.dev/react-native/streaming-response) | A reply that streams in, then settles with actions. | [README](src/components/streaming-response/README.md) |
| [Agent Loading States](https://beui.dev/react-native/loading-states) | Shimmers, cycling reasoning text and a progress timer. | [README](src/components/loading-states/README.md) |
| [Agent Activity](https://beui.dev/react-native/agent-activity) | Steps, searches and tool calls in one live log. | [README](src/components/agent-activity/README.md) |
| [Todo List](https://beui.dev/react-native/todo-list) | A plan whose marks morph as tasks finish. | [README](src/components/todo-list/README.md) |
| [Tool Approval](https://beui.dev/react-native/tool-approval) | Hold to let an agent run a tool. | [README](src/components/tool-approval/README.md) |
| [Approval Card](https://beui.dev/react-native/approval-card) | Swipeable questions, or a review to approve. | [README](src/components/approval-card/README.md) |
| [Tool Result](https://beui.dev/react-native/tool-result) | Output that streams in, then folds into a result. | [README](src/components/tool-result/README.md) |
| [Citations](https://beui.dev/react-native/citations) | Tap a number and its source springs up. | [README](src/components/citations/README.md) |
| [Code Block](https://beui.dev/react-native/code-block) | Streaming code with fixed line numbers and wrap. | [README](src/components/code-block/README.md) |
| [File Diff](https://beui.dev/react-native/file-diff) | Changes with live counts and folded context. | [README](src/components/file-diff/README.md) |
| [Image Generation](https://beui.dev/react-native/image-generation) | A dot field you can steer while the image forms. | [README](src/components/image-generation/README.md) |
| [Voice Orb](https://beui.dev/react-native/voice-orb) | A liquid sphere that moves with your voice. | [README](src/components/voice-orb/README.md) |

## Try it on your phone

Scan this code with [Expo Go](https://expo.dev/go) (SDK 57) to open the showcase, with every component on its own page in light and dark. Each component's page on beui.dev has a code that opens it directly.

<img alt="QR code that opens the beUI Native showcase in Expo Go" src="https://qr.expo.dev/eas-update?projectId=93a3a95c-6dc2-4adb-b57c-efbecf859f25&runtimeVersion=exposdk:57.0.0&channel=production" width="180" />

To run the showcase from source, you need Node.js 22.13 or later and [Bun](https://bun.sh) 1.3.14:

```sh
git clone https://github.com/starc007/beui-native.git
cd beui-native
bun install --frozen-lockfile
bun dev
```

Scan the code it prints with Expo Go on a phone on the same network, or run `bun ios` or `bun android`.

## Adding components by hand

The CLI does these steps for you. To do them yourself:

1. **Set up your app once** with the [setup guide](https://beui.dev/docs/native-setup): it installs the libraries, adds Uniwind to your Metro config and `global.css`, adds the theme tokens from [`src/styles/theme.css`](src/styles/theme.css), and wraps your app in `GestureHandlerRootView`.
2. **Copy the component's folder** from `src/components/`, with the shared files its README lists at the end. Keep the folder layout, since components import them by relative path:
   - `src/hooks/`: reduced motion, presence and shake helpers
   - `src/primitives/`: drawn paths and icons
   - `src/styles/motion.ts`: beUI's springs and easing curves
3. **Install its libraries.** Each component's page on beui.dev lists the exact commands. In an Expo app, use `npx expo install` so versions match your SDK.

The components are tested with:

| Library | Version |
| --- | --- |
| React Native | 0.86 (Expo SDK 57), React 19 |
| [Reanimated](https://docs.swmansion.com/react-native-reanimated/) and Worklets | 4.5 and 0.10 |
| [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) | 2.32 |
| [Uniwind](https://docs.uniwind.dev) with Tailwind CSS | 1.12 with 4.3 |

The shared source doesn't depend on Expo, so the components also work in a bare React Native app.

### Icons

Components take any icon library. An icon is a component given `{ size, color }`, or a ready-made element. The showcase uses [Hugeicons](https://hugeicons.com), imported one file per icon so only the icons in use are bundled.

## Principles

- **Built for touch.** Motion is designed for fingers, not ported from hover. Controls run on one spring so closing plays opening backward, gestures follow the finger on the UI thread, and anything a finger covers, like a color picker's thumb, gets a loupe.
- **Motion that respects people.** Every component honors the system's Reduce Motion setting and takes a `disableAnimation` prop.
- **Accessible by default.** Accessible names, roles and states, adjustable actions for screen readers, comfortable touch targets and support for large text are part of each component.
- **Yours to change.** Components are plain source with semantic tokens, so restyling one is editing a class name.

## Development

```text
src/
  components/   One folder per component, each with a README
  hooks/        Shared hooks: reduced motion, presence, shake
  primitives/   Shared drawing and icon helpers
  styles/       Theme tokens and motion settings
  index.ts      Exports every component
example/        Expo Router showcase that imports ../src directly
  app/          The component list and one page per component
  components/   Showcases, and registry.ts listing every component
cli/            The beui-native CLI, published to npm
```

```sh
bun check          # TypeScript and Biome
bun run format     # Format and apply safe lint fixes
bun doctor         # Expo configuration and dependency checks
bun run export     # Production bundles for iOS and Android
```

Bundling isn't device testing. Before a component ships, check it on iOS and Android with VoiceOver or TalkBack, large text, reduced motion and cancelled gestures.

Install or upgrade app dependencies from `example/` with `bunx expo install <package> --bun`, and commit the root `bun.lock`.

## Contributing

Bug reports, component requests and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) to get set up, and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Acknowledgements

- [beUI](https://beui.dev), the web library these components are ported from
- [Software Mansion](https://swmansion.com) for Reanimated and Gesture Handler
- [Uniwind](https://uniwind.dev) for Tailwind styling in React Native
- [Hugeicons](https://hugeicons.com) for the showcase's icons

## Author

Built by Saurabh ([@saurra3h](https://x.com/saurra3h) on X), the creator of [beUI](https://beui.dev).

## License

[MIT](LICENSE) © 2026 beUI and Saurabh
