import { describe, it, expect } from 'vitest';
import { groupPageLinks } from './page-links';

describe('groupPageLinks', () => {
  it('splits pages into menu and footer groups, dropping "none"', () => {
    const groups = groupPageLinks([
      { uri: 'about', title: 'About', linkLocation: 'menu' },
      { uri: 'privacy-policy', title: 'Privacy policy', linkLocation: 'footer' },
      { uri: 'drafts', title: 'Drafts', linkLocation: 'none' }
    ]);
    expect(groups.menu).toEqual([{ uri: 'about', title: 'About' }]);
    expect(groups.footer).toEqual([{ uri: 'privacy-policy', title: 'Privacy policy' }]);
  });

  it('preserves the incoming order within each group', () => {
    const groups = groupPageLinks([
      { uri: 'b', title: 'B', linkLocation: 'footer' },
      { uri: 'a', title: 'A', linkLocation: 'footer' }
    ]);
    expect(groups.footer.map((l) => l.uri)).toEqual(['b', 'a']);
  });

  it('falls back to the uri when a linked page has a blank title', () => {
    const groups = groupPageLinks([{ uri: 'about', title: '  ', linkLocation: 'menu' }]);
    expect(groups.menu).toEqual([{ uri: 'about', title: 'about' }]);
  });

  it('returns empty groups for no pages', () => {
    expect(groupPageLinks([])).toEqual({ menu: [], footer: [] });
  });
});
