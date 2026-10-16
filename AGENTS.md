# Working in beUI Native

- Use Bun and the root lockfile. Install app dependencies through Expo from `example/`.
- Shared source lives in `src/` and must not import from `example/` or depend on Expo.
- The example consumes shared source directly. Do not introduce a package build pipeline until distribution needs it.
- Use semantic Uniwind tokens for appearance, Reanimated for motion, and Gesture Handler for gesture-driven components. Respect system reduced motion.
- Keep accessible names, roles, states, text scaling, and adequate touch targets part of component behavior.
- Run `bun check`. For dependency or Metro changes, also run `bun doctor` and `bun run export`.
- Bundling is not device validation. State separately what was checked on iOS, Android, and web.
- Follow the versioned Expo guidance in `example/AGENTS.md` when working on the showcase. The showcase uses Expo Router: `example/app/index.tsx` lists components and `example/app/[component].tsx` shows one. Register each new component's showcase in `example/components/registry.ts`; keep showcases and helpers out of `example/app/`.
- Run `bun run manifest` and commit `showcase.json` after adding a component or changing what one imports; CI fails if it's out of date (see "The manifest" in `CONTRIBUTING.md`).
- Contributors stop at a merged pull request with an updated `showcase.json`. Recording clips, the Expo Go update and syncing to beui.dev are maintainer steps, listed under "Publishing to beui.dev" in `CONTRIBUTING.md`.
