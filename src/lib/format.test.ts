import { describe, it, expect } from 'vitest';
import { formatAttribution } from './format';

describe('formatAttribution', () => {
  it('joins attribution and source with a semicolon', () => {
    expect(formatAttribution('Strahan Coleman', 'Prayer Vol. 02')).toBe(
      'Strahan Coleman; Prayer Vol. 02'
    );
  });

  it('returns attribution alone when there is no source', () => {
    expect(formatAttribution('Strahan Coleman', null)).toBe('Strahan Coleman');
  });

  it('returns source alone when there is no attribution', () => {
    expect(formatAttribution(null, 'Psalm 46:10')).toBe('Psalm 46:10');
  });

  it('returns null when both are missing', () => {
    expect(formatAttribution(null, null)).toBeNull();
  });

  it('treats empty strings as missing', () => {
    expect(formatAttribution('', 'Psalm 46:10')).toBe('Psalm 46:10');
    expect(formatAttribution('Strahan Coleman', '')).toBe('Strahan Coleman');
    expect(formatAttribution('', '')).toBeNull();
  });
});
