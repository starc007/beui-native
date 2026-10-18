import {
  normalizeTokens,
  Prism,
  type PrismTheme,
  themes,
} from "prism-react-renderer";
import { useMemo } from "react";
import { useUniwind } from "uniwind";

export type CodeLanguage =
  | "bash"
  | "css"
  | "go"
  | "javascript"
  | "json"
  | "jsx"
  | "kotlin"
  | "markdown"
  | "python"
  | "rust"
  | "sql"
  | "swift"
  | "text"
  | "tsx"
  | "typescript"
  | "yaml";

export type CodeToken = { content: string; color?: string };
export type CodeTokenLines = CodeToken[][];

// Prism's bundle has no shell grammar; this covers what agents usually run.
if (!Prism.languages.bash) {
  Prism.languages.bash = {
    comment: { pattern: /(^|\s)#.*/, lookbehind: true },
    string: { pattern: /(["'])(?:\\.|(?!\1)[^\\])*\1/, greedy: true },
    variable: /\$(?:\w+|\{[^}]+\})/,
    function: { pattern: /(^|[|;&]\s*|\$\s+)[\w./-]+/m, lookbehind: true },
    keyword:
      /\b(?:if|then|else|elif|fi|for|while|do|done|case|esac|in|function|export|return)\b/,
    property: /(^|\s)--?[\w-]+/,
    operator: /&&|\|\||[|;&<>]/,
    number: /\b\d+(?:\.\d+)?\b/,
  };
}

const LIGHT = themes.github;
const DARK = themes.oneDark;

function palette(theme: PrismTheme) {
  const colors = new Map<string, string>();
  for (const style of theme.styles) {
    const color = style.style.color;
    if (!color) continue;
    for (const type of style.types) colors.set(type, color);
  }
  return colors;
}
const PALETTES = { light: palette(LIGHT), dark: palette(DARK) };

// Small, bounded cache: streaming code re-tokenizes a growing string.
const cache = new Map<string, string[][][]>();
const CACHE_SIZE = 64;

/** Splits code into lines of tokens, each token tagged with its Prism types. */
function tokenize(code: string, language: CodeLanguage) {
  const key = `${language}\u0000${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const grammar = language === "text" ? undefined : Prism.languages[language];
  const lines = grammar
    ? normalizeTokens(Prism.tokenize(code, grammar)).map((line) =>
        line.map((token) => [token.content, ...token.types]),
      )
    : code.split("\n").map((line) => [[line, "plain"]]);
  cache.set(key, lines);
  if (cache.size > CACHE_SIZE)
    cache.delete(cache.keys().next().value as string);
  return lines;
}

/**
 * Syntax-highlighted lines for the current light or dark theme. Tokenizing is
 * synchronous, so streamed code never flashes back to plain text.
 */
export function useCodeTokens(
  code: string,
  language: CodeLanguage,
): CodeTokenLines {
  const { theme } = useUniwind();
  const colors = theme === "dark" ? PALETTES.dark : PALETTES.light;
  return useMemo(
    () =>
      tokenize(code, language).map((line) =>
        line.map(([content = "", ...types]) => {
          let color: string | undefined;
          for (const type of types) color = colors.get(type) ?? color;
          return { content, color };
        }),
      ),
    [code, colors, language],
  );
}
