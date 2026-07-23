import Reveal from "$lib/components/Reveal.svelte";

export type ContentBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "small"; text: string }
  | { type: "hr"; text: null }
  | { type: "br"; text: null };

/**
 * Markdown-lite for page content: `# `/`## ` heading lines and blank-line
 * separated paragraphs. Nothing else — deliberately not a markdown engine.
 * Paragraphs keep internal single newlines (render with `white-space: pre-line`).
 * A separator of two or more blank lines emits a `br` block per extra blank line.
 */
export function parseContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  // Split into paragraph chunks, capturing the blank-line runs between them so
  // extra blank lines (2+) can be rendered as `<br />` spacers.
  const parts = content.split(/((?:\r?\n[ \t]*){2,})/);
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      // Separator: one blank line (2 newlines) is a normal paragraph break;
      // each additional blank line becomes a `br`.
      const newlines = (part.match(/\r?\n/g) ?? []).length;
      for (let n = 0; n < newlines - 2; n++)
        blocks.push({ type: "br", text: null });
      return;
    }
    const chunk = part.trim();
    if (chunk === "") return;
    if (chunk.startsWith("## "))
      blocks.push({ type: "h2", text: chunk.slice(3).trim() });
    else if (chunk.startsWith("# "))
      blocks.push({ type: "h1", text: chunk.slice(2).trim() });
    else if (chunk.startsWith("-# "))
      blocks.push({ type: "small", text: chunk.slice(3).trim() });
    else if (chunk.startsWith("---")) blocks.push({ type: "hr", text: null });
    else blocks.push({ type: "p", text: chunk });
  });
  return blocks;
}

/** Plain text of a block list — for search haystacks and card previews. */
export function blocksToText(blocks: ContentBlock[]): string {
  return blocks
    .map((b) => (b.text === null ? "" : stripInline(b.text)))
    .join(" ");
}

export interface BlocksToHtmlOptions {
  /** Demote headings by this many levels (h1→h2, h2→h3), clamped at h6. */
  headingOffset?: number;
  /** Class applied to every rendered element. */
  blockClass?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Backslash escaping for inline markers: `\*`, `\_`, `\\`. An escaped char is
 * lifted out to a private-use sentinel *before* the marker regexes run so it
 * can't be read as part of a `**`/`__` pair, then swapped back to its literal
 * char afterwards. The sentinels are untouched by {@link escapeHtml} and the
 * marker rewrites, and the restored literals (`* _ \`) need no HTML escaping.
 */
const ESCAPABLE = "\\*_";
// Map each escapable char to a distinct PUA sentinel (0xE000+) and back.
const toSentinel = new Map(
  [...ESCAPABLE].map((ch, i) => [ch, String.fromCharCode(0xe000 + i)]),
);
const fromSentinel = new Map(
  [...toSentinel].map(([ch, sentinel]) => [sentinel, ch]),
);
const SENTINELS = new RegExp(`[${[...fromSentinel.keys()].join("")}]`, "g");

function protectEscapes(text: string): string {
  return text.replace(/\\([\\*_])/g, (_m, ch: string) => toSentinel.get(ch)!);
}

function restoreEscapes(text: string): string {
  return text.replace(SENTINELS, (ch) => fromSentinel.get(ch)!);
}

/**
 * Inline formatting: `**bold**` → `<strong>`, `__italic__` → `<em>`. Pulls
 * backslash-escaped markers out first, escapes HTML (the markers survive
 * escaping), rewrites markers to tags, then restores the escaped literals.
 * Bold before italic so either nesting order (`**__x__**`/`__**x**__`) resolves.
 */
function inlineToHtml(text: string): string {
  return restoreEscapes(
    escapeHtml(protectEscapes(text))
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<em>$1</em>"),
  );
}

/** Drop inline `**`/`__` markers, leaving the text they wrapped; escapes too. */
function stripInline(text: string): string {
  return restoreEscapes(
    protectEscapes(text)
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/__(.+?)__/g, "$1"),
  );
}

/**
 * Renders a block list to an HTML string for `{@html}`. Single source of truth
 * for the block→tag mapping shared by the reflection screen and page routes.
 * Text is escaped; single newlines are preserved for `white-space: pre-line`.
 */
export function blocksToHtml(
  blocks: ContentBlock[],
  opts: BlocksToHtmlOptions = {},
): string {
  const { headingOffset = 0, blockClass } = opts;
  const attr = blockClass ? ` class="${blockClass}"` : "";
  return blocks
    .map((block) => {
      if (block.type === "hr") return `<hr />`;
      if (block.type === "br") return `<br />`;
      // "small"/"p" render as their own tag; headings demote by headingOffset.
      const tag =
        block.type === "h1"
          ? `h${Math.min(1 + headingOffset, 6)}`
          : block.type === "h2"
            ? `h${Math.min(2 + headingOffset, 6)}`
            : block.type;
      return `<${tag}${attr}>${inlineToHtml(block.text)}</${tag}>`;
    })
    .join("");
}
