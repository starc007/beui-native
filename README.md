# beUI Native

Animated, accessible components for React Native, built for touch. A native companion to [beUI](https://beui.dev): the same component APIs and motion language, rebuilt for phones with Reanimated, Gesture Handler and Uniwind.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Expo SDK 57](https://img.shields.io/badge/Expo%20SDK-57-000020.svg)
![React Native 0.86](https://img.shields.io/badge/React%20Native-0.86-61dafb.svg)
![Platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20web-lightgrey.svg)

beUI Native isn't an npm package. Like beUI on the web, you copy the components you want into your app and own the code. Every component lives in its own folder with a README covering its API, motion and accessibility.

## Components

| Component | What it does |
| --- | --- |
| **Actions** | |
| [Button](src/components/button/README.md) | Spring press, ripple, icons, and a stateful variant for async actions. |
| [Expandable Control](src/components/expandable-control/README.md) | Buttons and chips that spring open to reveal a label or an action. |
| [Card](src/components/card/README.md) | Composable surfaces, selectable with press feedback. |
| **Forms** | |
| [Input](src/components/input/README.md) | Error shake, focus ring and a drawn success check. |
| [OTP Input](src/components/otp-input/README.md) | Digits roll into slots, with SMS autofill. |
| [Select](src/components/select/README.md) | A panel that unfolds out of its trigger. |
| [Multi Select](src/components/multi-select/README.md) | Searchable options that become removable chips. |
| [Color Picker](src/components/color-picker/README.md) | A popover picker with a loupe under your finger. |
| [Checkbox](src/components/checkbox/README.md) | A checkmark that draws itself in. |
| [Radio Group](src/components/radio/README.md) | One dot glides to the option you pick. |
| [Range Slider](src/components/range-slider/README.md) | A bar thumb that glides between steps. |
| [Switch](src/components/switch/README.md) | A weighty thumb that squishes and stretches. |
| **Navigation and lists** | |
| [Bouncy Accordion](src/components/bouncy-accordion/README.md) | FAQ rows that spring apart as they open. |
| [Tabs](src/components/tabs/README.md) | Pill, segment and underline tabs with a gliding indicator. |
| [Swipeable List](src/components/swipeable-list/README.md) | Rows that swipe to reveal actions. |
| **Motion and feedback** | |
| [Number Animation](src/components/number/README.md) | Rolling tickers and count-ups. |
| [Text Animation](src/components/text-animation/README.md) | Reveals, sweeps, shimmers, cascades and scrambles. |
| [Alert](src/components/alert/README.md) | Feedback that eases in and folds away. |
| [Animated Badge](src/components/animated-badge/README.md) | Status pills whose icon and label roll. |
| [Loader](src/components/loader/README.md) | Seventeen loading indicators from one size prop. |

## Try the showcase

The `example/` app shows every component on its own page, in light and dark.

To try it on your phone without cloning, scan this code with [Expo Go](https://expo.dev/go) (SDK 57). It loads the latest published showcase.

<img alt="QR code that opens the beUI Native showcase in Expo Go" src="https://qr.expo.dev/eas-update?projectId=93a3a95c-6dc2-4adb-b57c-efbecf859f25&runtimeVersion=exposdk:57.0.0&channel=production" width="180" />

To run it from source, you need Node.js 22.13 or later and [Bun](https://bun.sh) 1.3.14.

```sh
git clone https://github.com/starc007/beui-native.git
cd beui-native
bun install --frozen-lockfile
bun dev
```

Scan the QR code with [Expo Go](https://expo.dev/go) (SDK 57) on a phone on the same network. To use a simulator or browser instead, run `bun ios`, `bun android` or `bun web`.

## Use a component in your app

The quickest way is the CLI. After the [one-time setup](https://beui.dev/docs/native-setup), it copies a component and the shared files it needs into `src/` and installs its libraries:

```sh
npx beui-native add tabs
```

To do it by hand instead, follow these steps.

### 1. Install the dependencies

The components need these libraries. In an Expo app, `expo install` picks versions that match your SDK:

```sh
npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler
npm install uniwind tailwindcss
```

| Library | Tested with |
| --- | --- |
| React Native | 0.86 (Expo SDK 57), React 19 |
| [Reanimated](https://docs.swmansion.com/react-native-reanimated/) and Worklets | 4.5 and 0.10 |
| [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) | 2.32 |
| [Uniwind](https://docs.uniwind.dev) with Tailwind CSS | 1.12 with 4.3 |

The shared source doesn't depend on Expo, so the components also work in a bare React Native app.

### 2. Set up the theme

If your app doesn't use Uniwind yet, follow its [quickstart](https://docs.uniwind.dev/quickstart) to add it to your Metro config. Components are styled with semantic color tokens, so they follow light and dark mode. Copy [`src/styles/theme.css`](src/styles/theme.css) into your app and import it from the CSS file Uniwind reads, next to Tailwind and Uniwind:

```css
@import "tailwindcss";
@import "uniwind";
@import "./theme.css";
```

Change the token values to match your brand. Wrap your app in `GestureHandlerRootView` if it isn't already.

### 3. Copy the component

Copy the component's folder from `src/components/`, along with the shared pieces its README lists at the end, usually some of:

- `src/hooks/`: reduced motion, presence and shake helpers
- `src/primitives/`: drawn paths and icons
- `src/styles/motion.ts`: beUI's springs and easing curves

Then import it like any other component in your app.

### Icons

Components take any icon library. An icon is a component given `{ size, color }`, or a ready-made element. The showcase uses [Hugeicons](https://hugeicons.com), imported one file per icon so only the icons in use are bundled.

## Principles

- **Built for touch.** Motion is designed for fingers, not ported from hover. Controls run on one spring so closing plays opening backward, gestures follow the finger on the UI thread, and anything a finger covers, like a color picker's thumb, gets a loupe.
- **Motion that respects people.** Every component honors the system's Reduce Motion setting and takes a `disableAnimation` prop.
- **Accessible by default.** Accessible names, roles and states, adjustable actions for screen readers, comfortable touch targets and support for large text are part of each component.
- **Yours to change.** Components are plain source with semantic tokens, so restyling one is editing a class name.

## Project structure

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
```

## Development

```sh
bun check          # TypeScript and Biome
bun run format     # Format and apply safe lint fixes
bun doctor         # Expo configuration and dependency checks
bun run export     # Production bundles for iOS, Android and web
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
