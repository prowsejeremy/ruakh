import { describe, it, expect } from 'vitest';
import { FALLBACK_THEME } from './themes';

describe('themes', () => {
  it('falls back to sunset with valid hex colors', () => {
    expect(FALLBACK_THEME.id).toBe('sunset');
    const hex = /^#[0-9a-f]{6}$/i;
    expect(FALLBACK_THEME.bg).toMatch(hex);
    expect(FALLBACK_THEME.line).toMatch(hex);
    expect(FALLBACK_THEME.ink).toMatch(hex);
  });
});
