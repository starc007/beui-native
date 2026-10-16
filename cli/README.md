# beui-native

Add [beUI Native](https://beui.dev/docs/native-setup) components to your React Native app. Like shadcn, it copies the source into your project, so every component is yours to change.

```sh
npx beui-native add tabs
```

It fetches the component from beui.dev, writes it and the shared files it needs into `src/`, adds the theme tokens if they're missing, and installs any libraries your app doesn't have yet. In an Expo app, libraries go through `expo install` so their versions match your SDK.

Do the [one-time setup](https://beui.dev/docs/native-setup) first: Uniwind in your Metro config, `global.css`, and `GestureHandlerRootView`. The command warns you if Uniwind is missing.

## Commands

```sh
npx beui-native add <component...>   # Copy components and install their libraries
npx beui-native list                 # List the available components
```

## Options

| Option | What it does |
| --- | --- |
| `--dir <path>` | Where the source goes. Defaults to `src`. |
| `--overwrite` | Replace files that differ from the registry. Your theme is never replaced. |
| `--dry-run` | Show what would change without writing or installing. |
| `--no-install` | Copy files but skip installing libraries. |
| `--registry <url>` | Read from another registry. Defaults to `https://beui.dev/native/r`. |

Files you've edited are kept and reported, so running `add` again is safe. Re-run with `--overwrite` to take the latest version.

Requires Node 18 or newer. MIT licensed.
