// Writes showcase.json, the component manifest that beui.dev reads to show
// native previews, Expo Go links and copy instructions.
//
//   bun run manifest           Write showcase.json
//   bun run manifest --check   Fail if showcase.json is out of date
//
// Components come from example/components/registry.ts, so the manifest never
// lists anything the showcase doesn't. Each component's shared files and
// libraries come from following its imports.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";

const ROOT = resolve(import.meta.dir, "..");
const OUT = join(ROOT, "showcase.json");
const REGISTRY = join(ROOT, "example/components/registry.ts");
const EXTENSIONS = [".tsx", ".ts", "/index.tsx", "/index.ts"];

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const rel = (path: string) => relative(ROOT, path).split("\\").join("/");

function parse(path: string) {
  return ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
}

// Registry entries: the literal fields of each item in each group. The slug
// is also the component's slug on beui.dev.
type Entry = {
  slug: string;
  title: string;
  description: string;
  group: string;
  variants: number;
};

function readRegistry(): Entry[] {
  const source = parse(REGISTRY);
  const entries: Entry[] = [];
  const literal = (object: ts.ObjectLiteralExpression, key: string) => {
    for (const property of object.properties) {
      if (
        ts.isPropertyAssignment(property) &&
        property.name.getText(source) === key
      ) {
        const value = property.initializer;
        if (ts.isStringLiteralLike(value)) return value.text;
        if (ts.isNumericLiteral(value)) return Number(value.text);
        return value;
      }
    }
    return undefined;
  };

  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === "groups" &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      for (const group of node.initializer.elements) {
        if (!ts.isObjectLiteralExpression(group)) continue;
        const title = literal(group, "title");
        const items = literal(group, "items");
        if (typeof title !== "string" || !items) continue;
        if (!ts.isArrayLiteralExpression(items as ts.Node)) continue;
        for (const item of (items as ts.ArrayLiteralExpression).elements) {
          if (!ts.isObjectLiteralExpression(item)) continue;
          const slug = literal(item, "slug");
          const name = literal(item, "title");
          const description = literal(item, "description");
          const variants = literal(item, "variants");
          if (
            typeof slug !== "string" ||
            typeof name !== "string" ||
            typeof description !== "string"
          ) {
            throw new Error(
              `registry.ts: an entry in "${title}" isn't literal`,
            );
          }
          entries.push({
            slug,
            title: name,
            description,
            group: title,
            variants: typeof variants === "number" ? variants : 1,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (entries.length === 0) throw new Error("registry.ts: no components found");
  return entries;
}

function filesIn(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return filesIn(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

function resolveImport(from: string, specifier: string) {
  const base = resolve(dirname(from), specifier);
  for (const extension of ["", ...EXTENSIONS]) {
    const path = base + extension;
    if (existsSync(path) && statSync(path).isFile()) return path;
  }
  throw new Error(`${rel(from)}: can't resolve "${specifier}"`);
}

function imports(path: string) {
  const specifiers: string[] = [];
  for (const statement of parse(path).statements) {
    if (
      (ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      // Type-only imports don't need to be installed or copied.
      const typeOnly = ts.isImportDeclaration(statement)
        ? statement.importClause?.isTypeOnly
        : statement.isTypeOnly;
      if (!typeOnly) specifiers.push(statement.moduleSpecifier.text);
    }
  }
  return specifiers;
}

const packageName = (specifier: string) =>
  specifier
    .split("/")
    .slice(0, specifier.startsWith("@") ? 2 : 1)
    .join("/");

// Follows a component's imports: files outside its folder are shared files
// to copy alongside it, and bare imports are libraries to install.
function trace(directory: string) {
  const own = filesIn(directory);
  const queue = [...own];
  const seen = new Set(queue);
  const shared = new Set<string>();
  const libraries = new Set<string>();
  while (queue.length > 0) {
    const file = queue.pop() as string;
    for (const specifier of imports(file)) {
      if (!specifier.startsWith(".")) {
        libraries.add(packageName(specifier));
        continue;
      }
      const target = resolveImport(file, specifier);
      if (!target.startsWith(join(ROOT, "src"))) {
        throw new Error(`${rel(file)} imports outside src/: "${specifier}"`);
      }
      if (!target.startsWith(directory)) shared.add(rel(target));
      if (!seen.has(target)) {
        seen.add(target);
        queue.push(target);
      }
    }
  }
  return {
    files: own.map(rel).sort(),
    shared: [...shared].sort(),
    libraries: [...libraries].sort(),
  };
}

function build() {
  const pkg = readJson(join(ROOT, "package.json"));
  const app = readJson(join(ROOT, "example/app.json")).expo;
  const example = readJson(join(ROOT, "example/package.json"));
  const sdk = Number(
    String(example.dependencies.expo).replace(/^\D*/, "").split(".")[0],
  );
  const projectId: string = app.extra.eas.projectId;
  const runtimeVersion = `exposdk:${sdk}.0.0`;
  const channel = "production";
  const repository = String(pkg.repository.url)
    .replace(/^git\+/, "")
    .replace(/\.git$/, "");

  // Expo Go opens the latest update on the channel; /--/<slug> deep links
  // to one component, with the list underneath.
  const expoGoUrl = (slug?: string) =>
    `exp://u.expo.dev/${projectId}${slug ? `/--/${slug}` : ""}` +
    `?runtime-version=${encodeURIComponent(runtimeVersion)}&channel-name=${channel}`;

  return {
    name: "beUI Native",
    version: pkg.version,
    description: pkg.description,
    repository,
    license: pkg.license,
    theme: "src/styles/theme.css",
    expoGo: {
      sdk,
      projectId,
      runtimeVersion,
      channel,
      url: expoGoUrl(),
      qr: `https://qr.expo.dev/eas-update?projectId=${projectId}&runtimeVersion=${runtimeVersion}&channel=${channel}`,
    },
    components: readRegistry().map((entry) => {
      const directory = join(ROOT, "src/components", entry.slug);
      if (!existsSync(directory)) {
        throw new Error(
          `No source folder for "${entry.slug}" in src/components`,
        );
      }
      const { files, shared, libraries } = trace(directory);
      return {
        ...entry,
        readme: `src/components/${entry.slug}/README.md`,
        source: `${repository}/tree/main/src/components/${entry.slug}`,
        files,
        shared,
        libraries,
        expoGo: expoGoUrl(entry.slug),
        clips: {
          light: `${entry.slug}-light.mp4`,
          dark: `${entry.slug}-dark.mp4`,
        },
      };
    }),
  };
}

// Biome formats the file the same way `bun run format` would.
function format(json: string) {
  const result = Bun.spawnSync(
    ["bunx", "biome", "format", "--stdin-file-path=showcase.json"],
    { cwd: ROOT, stdin: new TextEncoder().encode(json) },
  );
  if (result.exitCode !== 0) throw new Error(result.stderr.toString());
  return result.stdout.toString();
}

const manifest = build();
const output = format(`${JSON.stringify(manifest, null, 2)}\n`);

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== output) {
    console.error("showcase.json is out of date. Run `bun run manifest`.");
    process.exit(1);
  }
  console.log("showcase.json is up to date.");
} else {
  await Bun.write(OUT, output);
  console.log(
    `Wrote showcase.json with ${manifest.components.length} components.`,
  );
}
