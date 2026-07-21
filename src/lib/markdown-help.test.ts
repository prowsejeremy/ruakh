import { describe, it, expect } from 'vitest';
import { parseContent } from './markdown';
import { MARKDOWN_EXAMPLES, examplePreview } from './markdown-help';

describe('MARKDOWN_EXAMPLES', () => {
  it('documents each supported block type exactly once', () => {
    const types = MARKDOWN_EXAMPLES.flatMap((ex) => parseContent(ex.syntax).map((b) => b.type));
    // Every block type the parser can emit should be demonstrated.
    expect(new Set(types)).toEqual(new Set(['h1', 'h2', 'small', 'hr', 'p']));
  });

  it('has a non-empty label and syntax for every example', () => {
    for (const ex of MARKDOWN_EXAMPLES) {
      expect(ex.label.trim()).not.toBe('');
      expect(ex.syntax.trim()).not.toBe('');
    }
  });
});

describe('examplePreview', () => {
  it('renders each documented feature via the real parser', () => {
    // Dogfoods parseContent/blocksToHtml so the help can never drift from behavior.
    expect(examplePreview('# A heading')).toBe('<h1>A heading</h1>');
    expect(examplePreview('## A subheading')).toBe('<h2>A subheading</h2>');
    expect(examplePreview('-# A small note')).toBe('<small>A small note</small>');
    expect(examplePreview('Some **bold** text')).toBe('<p>Some <strong>bold</strong> text</p>');
    expect(examplePreview('Some __italic__ text')).toBe('<p>Some <em>italic</em> text</p>');
    expect(examplePreview('---')).toBe('<hr />');
    expect(examplePreview('First paragraph.\n\nSecond paragraph.')).toBe(
      '<p>First paragraph.</p><p>Second paragraph.</p>'
    );
  });

  it('produces a preview for every example in the list', () => {
    for (const ex of MARKDOWN_EXAMPLES) {
      expect(examplePreview(ex.syntax).length).toBeGreaterThan(0);
    }
  });
});
