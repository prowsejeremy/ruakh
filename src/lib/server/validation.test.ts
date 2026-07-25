import { describe, it, expect } from 'vitest';
import { pageTitleError, pageLinkLocationError } from './validation';

describe('pageTitleError', () => {
  it('accepts a normal title', () => {
    expect(pageTitleError('About')).toBeNull();
  });

  it('rejects a missing or non-string title', () => {
    expect(pageTitleError(null)).toMatch(/required/i);
    expect(pageTitleError(undefined)).toMatch(/required/i);
    expect(pageTitleError(42)).toMatch(/required/i);
  });

  it('rejects a blank title', () => {
    expect(pageTitleError('   ')).toMatch(/required/i);
  });

  it('rejects an overlong title', () => {
    expect(pageTitleError('x'.repeat(121))).toMatch(/too long/i);
    expect(pageTitleError('x'.repeat(120))).toBeNull();
  });
});

describe('pageLinkLocationError', () => {
  it('accepts each valid location', () => {
    expect(pageLinkLocationError('menu')).toBeNull();
    expect(pageLinkLocationError('footer')).toBeNull();
    expect(pageLinkLocationError('none')).toBeNull();
  });

  it('rejects anything else', () => {
    expect(pageLinkLocationError('sidebar')).toMatch(/link location/i);
    expect(pageLinkLocationError(null)).toMatch(/link location/i);
    expect(pageLinkLocationError('')).toMatch(/link location/i);
  });
});
