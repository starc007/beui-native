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
- There's no npm package of the components. People copy them from `src/`, by hand or with the `beui-native` CLI in `cli/`, which reads beui.dev's registry.

## Building a component

Each component is a folder in `src/components/` with:

- the component, exported from the folder's `index.ts` and from `src/index.ts`
- a `README.md` covering its API, motion and accessibility, and listing the shared files someone needs to copy it
- a showcase in `example/components/`, registered in `example/components/registry.ts`
- an updated `showcase.json`: run `bun run manifest` after registering the showcase (see [The manifest](#the-manifest))

And it follows these rules:

- **Styling:** semantic Uniwind tokens (`bg-surface`, `text-muted`, `border-border`), never raw colors, so it follows light and dark mode. Keep class names static so Uniwind can find them.
- **Motion:** Reanimated, on the UI thread. Drive a control's motion from one progress value, so closing plays opening backward and a tap mid-motion reverses smoothly. Don't scale content to fake a bounce.
- **Gestures:** Gesture Handler. Make sure gestures still let the page scroll.
- **Reduced motion:** respect the system setting with `useReducedMotionPreference`, and accept a `disableAnimation` prop.
- **Accessibility:** accessible names, roles and states, adjustable actions where it makes sense, comfortable touch targets and support for large text.
- **Haptics:** offer callbacks, like `onValueCommit`, rather than calling a haptics library from `src/`.

## The manifest

`showcase.json` describes every component for beui.dev and the `beui-native` CLI: its title, description, group and variant count, its own files, the shared files it needs, the libraries it imports, and its README, source and Expo Go links. `bun run manifest` (`scripts/manifest.ts`) generates it from the showcase registry, following each component's imports to find its shared files and libraries. Don't edit it by hand.

Run `bun run manifest` and commit `showcase.json` whenever you:

- add a component or register its showcase
- change what a component imports, including a new library or shared file, even inside an existing component
- change a component's title, description, group or variants in `example/components/registry.ts`

CI runs `bun run manifest --check` and fails if the committed file is out of date. Out of date, beui.dev would show the wrong install steps and the CLI would skip files a component needs.

## Checks

Run these before opening a pull request:

```sh
bun check                  # TypeScript and Biome
bun run format             # Format and apply safe lint fixes
bun run manifest --check   # showcase.json matches the source
```

If you change dependencies or the Metro config, also run `bun doctor` and `bun run export`. Install app dependencies from `example/` with `bunx expo install <package> --bun`, and commit the root `bun.lock`.

Passing checks and bundles doesn't prove a component works on a device. In your pull request, say what you tested on iOS, on Android and on web, including VoiceOver or TalkBack, large text and reduced motion where they apply.

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org): `feat: add date picker`, `fix: let the accordion bounce on close`.
- Keep a pull request to one component or one fix.
- Include a screen recording or GIF for anything that moves.

## After your pull request merges

You're done. A maintainer records the clips for beui.dev, updates the Expo Go showcase and syncs the component to the site. It appears on beui.dev, and installs with `npx beui-native add`, after the next site release.

## Publishing to beui.dev (maintainers)

These steps need accounts and a Mac, so maintainers do them after a component merges:

- a Mac with Xcode, the iOS Simulator and `ffmpeg`
- this repo and [ui-components](https://github.com/starc007/ui-components) (beui.dev) cloned side by side
- an Expo login for EAS Update, and `wrangler login` on the beUI Cloudflare account

### 1. Record the clips

Every component gets a light and a dark clip, recorded from a Release build so they show production motion without developer overlays:

```sh
cd example
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 bunx expo run:ios --configuration Release
git checkout package.json   # expo run rewrites its scripts
cd ..
```

Then record each theme with `scripts/record.sh` (run it without arguments to see every command):

```sh
scripts/record.sh prepare                       # 9:41, full battery
xcrun simctl spawn booted defaults write -g AppleLocale en_US
scripts/record.sh theme light
xcrun simctl openurl booted "beui-native://"    # start from the list, for a fresh page
scripts/record.sh open <slug>                   # opens with ?record=1, which hides the back button
scripts/record.sh start <slug> light
# Use the component: tap through each section, and scroll a long page down
# and back to the top, so the loop ends where it starts.
scripts/record.sh stop
scripts/record.sh encode <slug> light           # writes recordings/<slug>-light.mp4
```

Repeat with `dark`. `encode` trims the still start itself. To drop a pause in the middle, such as while you checked a screenshot, pass the raw seconds: `CUT=14.7-24.5 scripts/record.sh encode <slug> light`. Watch the clip before moving on.

When you're done, put the Simulator back:

```sh
xcrun simctl status_bar booted clear
xcrun simctl spawn booted defaults write -g AppleLocale <your locale>
```

Clips live in `recordings/`, which git ignores.

### 2. Update the Expo Go showcase

The QR codes on beui.dev open the `production` channel, so publish the merged showcase there:

```sh
cd example
bunx eas-cli update --channel production --environment production --platform all --message <OneWord> --non-interactive
```

Keep the message to one word: `bunx` splits arguments at spaces.

### 3. Sync to beui.dev

In ui-components:

```sh
bun scripts/sync-native.ts
```

It uploads new clips and posters to R2 (media.beui.dev), and rewrites the catalog, slugs, sidebar list and summary in `lib/native/`. Check the component's page at `/react-native/<slug>` on the dev server: the clip, the Expo Go QR code, the install command, its README and the related components. Then commit and release the site.

If the shape of `/native/r` changed, redeploy the MCP worker after the release with `cd mcp && bun run deploy`.

### 4. Publish the CLI, if it changed

Only when `cli/` changed: bump its version in `cli/package.json`, then run `npm publish` from `cli/`.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
