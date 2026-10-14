# Contributing to beUI Native

Thanks for helping. Bug reports, component requests and pull requests are all welcome.

## Before you start

- **Bugs:** [open an issue](https://github.com/starc007/beui-native/issues/new/choose) with the platform (iOS, Android or web), device or simulator, and steps to reproduce. A screen recording helps a lot for motion bugs.
- **New components:** open an issue first, so we can agree on the API and the motion before you build it. Components usually port one from [beUI](https://beui.dev), but they're designed for touch, not copied from the web.
- **Small fixes**, like typos or a missing accessibility label, can go straight to a pull request.

## Setup

You need Node.js 22.13 or later and [Bun](https://bun.sh) 1.3.14.

```sh
bun install --frozen-lockfile
bun dev
```

Open the showcase in Expo Go (SDK 57), or run `bun ios`, `bun android` or `bun web`. Edits under `src/` hot-reload.

## How the repository works

- `src/` holds the shared components. It must not import from `example/` or depend on Expo, so the components can be copied into any React Native app.
- `example/` is an Expo Router app that imports `../src` directly. `example/app/index.tsx` lists components and `example/app/[component].tsx` shows one. Showcases and helpers live in `example/components/`, not in `example/app/`.
- There's no build or npm package. People copy components from `src/`.

## Building a component

Each component is a folder in `src/components/` with:

- the component, exported from the folder's `index.ts` and from `src/index.ts`
- a `README.md` covering its API, motion and accessibility, and listing the shared files someone needs to copy it
- a showcase in `example/components/`, registered in `example/components/registry.ts`

And it follows these rules:

- **Styling:** semantic Uniwind tokens (`bg-surface`, `text-muted`, `border-border`), never raw colors, so it follows light and dark mode. Keep class names static so Uniwind can find them.
- **Motion:** Reanimated, on the UI thread. Drive a control's motion from one progress value, so closing plays opening backward and a tap mid-motion reverses smoothly. Don't scale content to fake a bounce.
- **Gestures:** Gesture Handler. Make sure gestures still let the page scroll.
- **Reduced motion:** respect the system setting with `useReducedMotionPreference`, and accept a `disableAnimation` prop.
- **Accessibility:** accessible names, roles and states, adjustable actions where it makes sense, comfortable touch targets and support for large text.
- **Haptics:** offer callbacks, like `onValueCommit`, rather than calling a haptics library from `src/`.

## Checks

Run these before opening a pull request:

```sh
bun check          # TypeScript and Biome
bun run format     # Format and apply safe lint fixes
```

If you change dependencies or the Metro config, also run `bun doctor` and `bun run export`. Install app dependencies from `example/` with `bunx expo install <package> --bun`, and commit the root `bun.lock`.

Passing checks and bundles doesn't prove a component works on a device. In your pull request, say what you tested on iOS, on Android and on web, including VoiceOver or TalkBack, large text and reduced motion where they apply.

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org): `feat: add date picker`, `fix: let the accordion bounce on close`.
- Keep a pull request to one component or one fix.
- Include a screen recording or GIF for anything that moves.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
