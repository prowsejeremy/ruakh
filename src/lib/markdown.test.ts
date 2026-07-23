import { describe, it, expect } from 'vitest';
import { parseContent, blocksToText, blocksToHtml } from './markdown';

describe('parseContent (markdown-lite)', () => {
  it('returns no blocks for empty/whitespace content', () => {
    expect(parseContent('')).toEqual([]);
    expect(parseContent('  \n\n  ')).toEqual([]);
  });

  it('parses a single paragraph', () => {
    expect(parseContent('Just a paragraph.')).toEqual([{ type: 'p', text: 'Just a paragraph.' }]);
  });

  it('parses h1 and h2 heading lines', () => {
    expect(parseContent('# ruakh;')).toEqual([{ type: 'h1', text: 'ruakh;' }]);
    expect(parseContent('## Curated Reflections;')).toEqual([
      { type: 'h2', text: 'Curated Reflections;' }
    ]);
  });

  it('parses a mixed document in order', () => {
    const doc = '# ruakh;\n\nFirst paragraph.\n\n## Section;\n\nSecond paragraph.';
    expect(parseContent(doc).map((b) => b.type)).toEqual(['h1', 'p', 'h2', 'p']);
  });

  it('keeps single newlines inside a paragraph (pre-line rendering)', () => {
    const [block] = parseContent('line one\nline two');
    expect(block).toEqual({ type: 'p', text: 'line one\nline two' });
  });

  it('splits on CRLF blank lines too', () => {
    expect(parseContent('a\r\n\r\nb').length).toBe(2);
  });

  it('emits a br block between paragraphs separated by two blank lines', () => {
    const doc = 'Line one\n\n\nLine two\n\nLine three';
    expect(parseContent(doc)).toEqual([
      { type: 'p', text: 'Line one' },
      { type: 'br', text: null },
      { type: 'p', text: 'Line two' },
      { type: 'p', text: 'Line three' }
    ]);
  });

  it('emits one br per extra blank line beyond the paragraph break', () => {
    const doc = 'One\n\n\n\nTwo';
    expect(parseContent(doc).map((b) => b.type)).toEqual(['p', 'br', 'br', 'p']);
  });

  it('renders a br block to a <br /> tag', () => {
    const doc = 'Line one\n\n\nLine two';
    expect(blocksToHtml(parseContent(doc))).toBe('<p>Line one</p><br /><p>Line two</p>');
  });
});

describe('blocksToText', () => {
  it('returns empty string for no blocks', () => {
    expect(blocksToText([])).toBe('');
  });

  it('joins block texts with spaces, regardless of type', () => {
    expect(blocksToText(parseContent('# Title;\n\nFirst.\n\nSecond.'))).toBe(
      'Title; First. Second.'
    );
  });

  it('flattens nested block lists (one list per reflection section)', () => {
    const sections = ['One.\n\nTwo.', 'Three.'].map(parseContent);
    expect(blocksToText(sections.flat())).toBe('One. Two. Three.');
  });

  it('strips inline bold/italic markers from plain text', () => {
    expect(blocksToText(parseContent('a **bold** and __italic__ word'))).toBe(
      'a bold and italic word'
    );
  });

  it('unescapes backslash-escaped markers to their literal chars', () => {
    expect(blocksToText(parseContent('\\_\\_keep\\_\\_ and __drop__'))).toBe(
      '__keep__ and drop'
    );
  });
});

describe('blocksToHtml', () => {
  it('returns empty string for no blocks', () => {
    expect(blocksToHtml([])).toBe('');
  });

  it('maps each block type to its default tag', () => {
    const blocks = parseContent('# Title;\n\n## Section;\n\nBody.\n\n-# Aside.');
    expect(blocksToHtml(blocks)).toBe(
      '<h1>Title;</h1><h2>Section;</h2><p>Body.</p><small>Aside.</small>'
    );
  });

  it('demotes headings by headingOffset', () => {
    const blocks = parseContent('# Title;\n\n## Section;\n\nBody.');
    expect(blocksToHtml(blocks, { headingOffset: 1 })).toBe(
      '<h2>Title;</h2><h3>Section;</h3><p>Body.</p>'
    );
  });

  it('clamps demoted heading levels at h6', () => {
    const [h2] = parseContent('## Deep;');
    expect(blocksToHtml([h2], { headingOffset: 5 })).toBe('<h6>Deep;</h6>');
  });

  it('adds blockClass to every element when given', () => {
    const blocks = parseContent('# Title;\n\nBody.');
    expect(blocksToHtml(blocks, { blockClass: 'block' })).toBe(
      '<h1 class="block">Title;</h1><p class="block">Body.</p>'
    );
  });

  it('escapes HTML special characters in text', () => {
    const [block] = parseContent('a < b & c > d "e"');
    expect(blocksToHtml([block])).toBe('<p>a &lt; b &amp; c &gt; d "e"</p>');
  });

  it('preserves single newlines for pre-line rendering', () => {
    const [block] = parseContent('line one\nline two');
    expect(blocksToHtml([block])).toBe('<p>line one\nline two</p>');
  });

  it('renders **text** as <strong> inside a block', () => {
    const [block] = parseContent('a **bold** word');
    expect(blocksToHtml([block])).toBe('<p>a <strong>bold</strong> word</p>');
  });

  it('renders __text__ as <em> inside a block', () => {
    const [block] = parseContent('an __italic__ word');
    expect(blocksToHtml([block])).toBe('<p>an <em>italic</em> word</p>');
  });

  it('renders bold and italic inside headings too', () => {
    const [block] = parseContent('# a **bold** __heading__');
    expect(blocksToHtml([block])).toBe('<h1>a <strong>bold</strong> <em>heading</em></h1>');
  });

  it('handles multiple runs of the same marker', () => {
    const [block] = parseContent('**one** and **two**');
    expect(blocksToHtml([block])).toBe('<p><strong>one</strong> and <strong>two</strong></p>');
  });

  it('nests italic inside bold', () => {
    const [block] = parseContent('**bold __both__**');
    expect(blocksToHtml([block])).toBe('<p><strong>bold <em>both</em></strong></p>');
  });

  it('escapes HTML before applying inline markers', () => {
    const [block] = parseContent('**a < b**');
    expect(blocksToHtml([block])).toBe('<p><strong>a &lt; b</strong></p>');
  });

  it('renders escaped underscores literally instead of as italic', () => {
    const [block] = parseContent('\\_\\_\\_how are you today\\_\\_\\_');
    expect(blocksToHtml([block])).toBe('<p>___how are you today___</p>');
  });

  it('renders escaped asterisks literally instead of as bold', () => {
    const [block] = parseContent('\\*\\*not bold\\*\\*');
    expect(blocksToHtml([block])).toBe('<p>**not bold**</p>');
  });

  it('escapes markers without disturbing real markers elsewhere', () => {
    const [block] = parseContent('\\_\\_literal\\_\\_ and __italic__');
    expect(blocksToHtml([block])).toBe('<p>__literal__ and <em>italic</em></p>');
  });

  it('renders an escaped backslash as a single literal backslash', () => {
    const [block] = parseContent('a \\\\ b');
    expect(blocksToHtml([block])).toBe('<p>a \\ b</p>');
  });

  it('leaves a backslash before a non-escapable char untouched', () => {
    const [block] = parseContent('a \\b c');
    expect(blocksToHtml([block])).toBe('<p>a \\b c</p>');
  });
});
