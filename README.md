# beUI Native

React Native components with Uniwind styling and Reanimated motion. The shared source and Expo showcase currently include Button and Surface.

## Start

Use Node.js 22.13+ and Bun 1.3.14. From the repository root:

```sh
bun install --frozen-lockfile
bun dev
```

Open the QR code with an Expo Go version that supports SDK 57. The computer and phone should be on the same network. For installed simulators/emulators, use `bun ios` or `bun android`. Use `bun web` for a browser preview.

## Structure

```text
src/
  components/       Shared native components
  styles/           Semantic light/dark colors and motion settings
  index.ts          Source exports
example/            Expo showcase importing ../src directly
```

The root package is private to prevent accidental npm publication. This does not control GitHub repository visibility. Distribution starts with copyable source; npm publishing, paid components, and a registry are outside this initial setup.

The example owns the runtime dependencies. Bun hoists them into one workspace installation. Keep shared source independent of Expo so it can be copied into other React Native apps; app configuration and providers belong in `example/`.

## Foundation

- Expo SDK 57, React 19, and React Native 0.86.
- Uniwind and Tailwind CSS 4, with shared semantic theme tokens.
- Reanimated and Worklets at the versions selected by Expo.
- Gesture Handler root and safe-area providers.
- A demo for system/light/dark appearance and reduced-motion-aware press feedback.

`example/global.css` scans `../src` explicitly, and `example/metro.config.js` adds `../src` to Metro's watch folders so edits there hot-reload. Keep class names statically discoverable. Uniwind is the outermost Metro wrapper and generates `example/uniwind-types.d.ts`; this file is checked in so typechecking works before starting Metro. Expo's Babel preset configures Worklets automatically.

Components are native ports of [beUI](https://beui.dev) and match its API, variants and spring tokens (`src/styles/motion.ts` mirrors beUI's `lib/ease.ts`). The showcase covers [Button and StatefulButton](src/components/button/README.md), [Switch](src/components/switch/README.md), [Checkbox](src/components/checkbox/README.md), [Radio Group](src/components/radio/README.md), [Tabs](src/components/tabs/README.md), [Input](src/components/input/README.md), [OTP Input](src/components/otp-input/README.md), [Number Animation](src/components/number/README.md), [Text Animation](src/components/text-animation/README.md) and [Loader](src/components/loader/README.md). Icons in the showcase use `react-native-svg`; components accept any icon library.

## Checks

```sh
bun check          # TypeScript + Biome
bun doctor         # Expo configuration and dependency checks
bun run export     # Production JS/Hermes bundles for iOS, Android, and web
bun run format     # Format and apply safe lint fixes
```

Exports verify bundling, not native compilation or device behavior. Before shipping components, check VoiceOver/TalkBack, large text, reduced motion, cancelled gestures, and interactions on both iOS and Android. Profile performance in release builds on real devices.

Install or upgrade app dependencies from `example/` using `bunx expo install <package> --bun`, then run the checks above. Commit the root `bun.lock`; do not add nested lockfiles.

## Setup references

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Uniwind setup](https://docs.uniwind.dev/quickstart)
- [Uniwind shared-source scanning](https://docs.uniwind.dev/monorepos)
- [Expo Reanimated setup](https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/)
