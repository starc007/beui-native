#!/usr/bin/env node
// Adds beUI Native components to a React Native app: fetches each one from
// the beui.dev registry, writes its files, and installs its libraries.
// No dependencies, so `npx beui-native` starts fast.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
);

const REGISTRY =
  process.env.BEUI_NATIVE_REGISTRY ?? "https://beui.dev/native/r";
const SETUP_GUIDE = "https://beui.dev/docs/native-setup";

// Present in every React Native app; installing them again could downgrade.
const BUNDLED = new Set(["react", "react-native"]);
// Not Expo packages, so `expo install` has no version to pick for them.
const NPM_ONLY = new Set(["uniwind", "tailwindcss"]);

const HELP = `beui-native ${version}

Add beUI Native components to your React Native app.

Usage
  npx beui-native add <component...>   Copy components and install their libraries
  npx beui-native list                 List the available components

Options
  --dir <path>       Where the source goes (default: src)
  --overwrite        Replace files that differ from the registry
  --dry-run          Show what would change without writing or installing
  --no-install       Copy files but skip installing libraries
  --registry <url>   Registry to read from (default: ${REGISTRY})
  -h, --help         Show this help
  -v, --version      Show the version

Examples
  npx beui-native add button
  npx beui-native add tabs alert --dir app/ui

First time? Set up Uniwind and the theme once: ${SETUP_GUIDE}`;

const color = (code) => (text) =>
  process.stdout.isTTY && !process.env.NO_COLOR
    ? `\x1b[${code}m${text}\x1b[0m`
    : text;
const dim = color("2");
const bold = color("1");
const green = color("32");
const yellow = color("33");
const red = color("31");

class CliError extends Error {}

function parseArgs(argv) {
  const options = {
    dir: "src",
    overwrite: false,
    dryRun: false,
    install: true,
    registry: REGISTRY,
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      const next = argv[++i];
      if (!next || next.startsWith("-"))
        throw new CliError(`${arg} needs a value.`);
      return next;
    };
    if (arg === "--dir") options.dir = value();
    else if (arg === "--registry")
      options.registry = value().replace(/\/+$/, "");
    else if (arg === "--overwrite") options.overwrite = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--no-install") options.install = false;
    else if (arg === "-h" || arg === "--help") options.help = true;
    else if (arg === "-v" || arg === "--version") options.version = true;
    else if (arg.startsWith("-"))
      throw new CliError(`Unknown option ${arg}. Run with --help.`);
    else positional.push(arg);
  }
  return { command: positional[0], args: positional.slice(1), options };
}

async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url, { headers: { accept: "application/json" } });
  } catch (error) {
    throw new CliError(
      `Couldn't reach ${url}: ${error.cause?.message ?? error.message}`,
    );
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new CliError(`${url} answered ${response.status}.`);
  return response.json();
}

/** Registry paths start with src/. Re-root them under --dir, inside the app. */
function targetPath(cwd, dir, file) {
  const relative = file.replace(/^src\//, "");
  const target = path.resolve(cwd, dir, relative);
  const root = path.resolve(cwd);
  if (path.isAbsolute(relative) || !target.startsWith(root + path.sep)) {
    throw new CliError(`Refusing to write outside the project: ${file}`);
  }
  return target;
}

function readPackageJson(cwd) {
  const file = path.join(cwd, "package.json");
  if (!existsSync(file)) {
    throw new CliError(
      "No package.json here. Run this from your app's root folder.",
    );
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

function detectPackageManager(cwd) {
  const agent = process.env.npm_config_user_agent ?? "";
  for (const name of ["bun", "pnpm", "yarn"]) {
    if (agent.startsWith(`${name}/`)) return name;
  }
  if (
    existsSync(path.join(cwd, "bun.lock")) ||
    existsSync(path.join(cwd, "bun.lockb"))
  )
    return "bun";
  if (existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

/** The libraries a set of components needs that the app doesn't list yet. */
function missingLibraries(entries, pkg) {
  const wanted = new Set();
  for (const entry of entries) {
    for (const name of entry.libraries ?? [])
      if (!BUNDLED.has(name)) wanted.add(name);
  }
  // Reanimated 4 needs Worklets even when a component doesn't import it, and
  // Uniwind needs Tailwind to read the class names.
  if (wanted.has("react-native-reanimated"))
    wanted.add("react-native-worklets");
  if (wanted.has("uniwind")) wanted.add("tailwindcss");
  const listed = { ...pkg.dependencies, ...pkg.devDependencies };
  return [...wanted].filter((name) => !(name in listed)).sort();
}

function installCommands(libraries, packageManager, isExpo) {
  const add = {
    npm: ["npm", "install"],
    bun: ["bun", "add"],
    pnpm: ["pnpm", "add"],
    yarn: ["yarn", "add"],
  }[packageManager];
  const exec = { npm: ["npx"], bun: ["bunx"], pnpm: ["pnpm"], yarn: ["yarn"] }[
    packageManager
  ];
  const expo = isExpo ? libraries.filter((name) => !NPM_ONLY.has(name)) : [];
  const plain = libraries.filter((name) => !expo.includes(name));
  const commands = [];
  // expo install picks the versions that match the app's SDK.
  if (expo.length > 0) commands.push([...exec, "expo", "install", ...expo]);
  if (plain.length > 0) commands.push([...add, ...plain]);
  return commands;
}

function run(command, cwd) {
  console.log(dim(`$ ${command.join(" ")}`));
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    stdio: "inherit",
    // npx, bunx and friends are .cmd shims on Windows.
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new CliError(
      `${command.join(" ")} failed. Run it yourself, then try again.`,
    );
  }
}

/** Warn about one-time setup that's missing, without blocking the add. */
function setupWarnings(cwd, pkg) {
  const warnings = [];
  const metro = [
    "metro.config.js",
    "metro.config.cjs",
    "metro.config.mjs",
    "metro.config.ts",
  ]
    .map((name) => path.join(cwd, name))
    .find((file) => existsSync(file));
  if (!metro || !readFileSync(metro, "utf8").includes("withUniwindConfig")) {
    warnings.push(
      "Uniwind isn't in your Metro config yet, so components won't be styled.",
    );
  }
  const listed = { ...pkg.dependencies, ...pkg.devDependencies };
  if (!("react-native" in listed) && !("expo" in listed)) {
    warnings.push("This doesn't look like a React Native app.");
  }
  return warnings;
}

async function list(options) {
  const index = await fetchJson(options.registry);
  if (!index) throw new CliError(`No registry at ${options.registry}.`);
  let group;
  for (const component of index.components) {
    if (component.group !== group) {
      group = component.group;
      console.log(`\n${bold(group)}`);
    }
    console.log(`  ${component.slug.padEnd(22)}${dim(component.description)}`);
  }
  console.log(`\nAdd one with ${bold("npx beui-native add <component>")}.`);
}

async function add(slugs, options) {
  if (slugs.length === 0) {
    throw new CliError(
      "Name a component, like `npx beui-native add button`. Run `npx beui-native list` to see them all.",
    );
  }
  const cwd = process.cwd();
  const pkg = readPackageJson(cwd);

  const unique = [...new Set(slugs.map((slug) => slug.toLowerCase()))];
  const entries = await Promise.all(
    unique.map((slug) =>
      fetchJson(`${options.registry}/${encodeURIComponent(slug)}`),
    ),
  );
  const unknown = unique.filter((_, i) => !entries[i]);
  if (unknown.length > 0) {
    throw new CliError(
      `Unknown component: ${unknown.join(", ")}. Run \`npx beui-native list\` to see them all.`,
    );
  }

  // Components share hooks, primitives and the theme; write each file once.
  const files = new Map();
  for (const entry of entries) {
    for (const file of entry.files)
      if (!files.has(file.path)) files.set(file.path, file);
  }

  const results = { created: [], updated: [], unchanged: [], kept: [] };
  for (const file of files.values()) {
    const target = targetPath(cwd, options.dir, file.path);
    const shown = path.relative(cwd, target);
    if (!existsSync(target)) {
      results.created.push(shown);
      if (!options.dryRun) {
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, file.content);
      }
      continue;
    }
    if (readFileSync(target, "utf8") === file.content) {
      results.unchanged.push(shown);
    } else if (options.overwrite && file.type !== "theme") {
      // The theme holds your brand colors, so it's never replaced.
      results.updated.push(shown);
      if (!options.dryRun) writeFileSync(target, file.content);
    } else {
      results.kept.push({ path: shown, theme: file.type === "theme" });
    }
  }

  const verb = options.dryRun ? "Would " : "";
  for (const file of results.created)
    console.log(`${green("+")} ${verb}create ${file}`);
  for (const file of results.updated)
    console.log(`${yellow("~")} ${verb}update ${file}`);
  for (const file of results.unchanged)
    console.log(dim(`= ${file} is up to date`));
  for (const file of results.kept) {
    console.log(
      `${yellow("!")} Kept your ${file.path}${file.theme ? " (your theme)" : ", which differs. Use --overwrite to replace it"}`,
    );
  }

  const libraries = missingLibraries(entries, pkg);
  if (libraries.length > 0) {
    const commands = installCommands(
      libraries,
      detectPackageManager(cwd),
      "expo" in { ...pkg.dependencies, ...pkg.devDependencies },
    );
    console.log();
    if (!options.install || options.dryRun) {
      console.log(options.dryRun ? "Would install:" : "Install the libraries:");
      for (const command of commands) console.log(`  ${command.join(" ")}`);
    } else {
      for (const command of commands) run(command, cwd);
    }
  }

  const warnings = setupWarnings(cwd, pkg);
  if (warnings.length > 0) {
    console.log();
    for (const warning of warnings) console.log(`${yellow("!")} ${warning}`);
    console.log(`  Finish the one-time setup: ${SETUP_GUIDE}`);
  }

  if (!options.dryRun) {
    const folder = path.posix.join(
      options.dir.split(path.sep).join("/"),
      "components",
    );
    console.log(
      `\n${green("Done.")} Components are in ${bold(folder)}. Import them by relative path.`,
    );
  }
}

async function main() {
  const { command, args, options } = parseArgs(process.argv.slice(2));
  if (options.version) return console.log(version);
  if (options.help || !command) return console.log(HELP);
  if (command === "add") return add(args, options);
  if (command === "list") return list(options);
  throw new CliError(`Unknown command ${command}. Run with --help.`);
}

main().catch((error) => {
  console.error(red(error instanceof CliError ? error.message : error.stack));
  process.exitCode = 1;
});
