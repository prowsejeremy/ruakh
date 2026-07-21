import { parseContent, blocksToHtml } from "./markdown";

export interface MarkdownExample {
  /** Human-readable name of the formatting feature. */
  label: string;
  /** Raw markdown-lite an author would type to produce it. */
  syntax: string;
}

/**
 * The formatting features documented in the admin editor help, one per block
 * type the parser understands (see {@link parseContent}). Previews are produced
 * by the real parser via {@link examplePreview}, so the help can never drift
 * from actual behavior — markdown-help.test.ts pins that contract.
 */
export const MARKDOWN_EXAMPLES: MarkdownExample[] = [
  { label: "Heading", syntax: "# A heading" },
  { label: "Subheading", syntax: "## A subheading" },
  { label: "Small note", syntax: "-# A small note" },
  { label: "Bold", syntax: "Some **bold** text" },
  { label: "Italic", syntax: "Some __italic__ text" },
  { label: "Divider", syntax: "---" },
  { label: "Paragraphs", syntax: "First paragraph.\n\nSecond paragraph." },
];

/** Render one example's syntax to preview HTML through the real parser. */
export function examplePreview(syntax: string): string {
  return blocksToHtml(parseContent(syntax));
}
