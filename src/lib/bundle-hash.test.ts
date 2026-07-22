import { describe, it, expect } from 'vitest';
import { hashBundle } from './bundle-hash';
import { parseContent } from './markdown';
import type { ContentBundle } from './server/content-bundle';

/** Body parts the way toReflectionView produces them: parsed markdown-lite blocks. */
const body = (...parts: string[]) => parts.map(parseContent);

const base: ContentBundle = {
  reflections: [{ id: 1, body: body('a'), attribution: null, source: null, copyright: null }],
  pages: [{ uri: 'about', content: '# hi' }],
  themes: [{ id: 1, name: 'Sunset', bg: '#f7a31a', line: '#f5350b', ink: '#000000', sort: 0 }],
  generatedAt: '2026-07-03T00:00:00Z'
};

describe('hashBundle', () => {
  it('is stable for identical content, ignoring generatedAt', () => {
    expect(hashBundle(base)).toBe(hashBundle({ ...base, generatedAt: 'later' }));
  });

  it('changes when a reflection changes', () => {
    expect(hashBundle(base)).not.toBe(
      hashBundle({ ...base, reflections: [{ id: 1, body: body('b'), attribution: null, source: null, copyright: null }] })
    );
  });

  it('changes when a theme changes', () => {
    const themes = [{ ...base.themes[0], bg: '#000000' }];
    expect(hashBundle(base)).not.toBe(hashBundle({ ...base, themes }));
  });

  it('changes on delete (fewer items)', () => {
    expect(hashBundle(base)).not.toBe(hashBundle({ ...base, reflections: [] }));
  });

  it('changes when body parts are reordered or merged', () => {
    const twoParts = { ...base, reflections: [{ id: 1, body: body('a', 'b'), attribution: null, source: null, copyright: null }] };
    const merged = { ...base, reflections: [{ id: 1, body: body('ab'), attribution: null, source: null, copyright: null }] };
    const reordered = { ...base, reflections: [{ id: 1, body: body('b', 'a'), attribution: null, source: null, copyright: null }] };
    expect(hashBundle(twoParts)).not.toBe(hashBundle(merged));
    expect(hashBundle(twoParts)).not.toBe(hashBundle(reordered));
  });
});
