import { describe, it, expect } from 'vitest';
import { randomPassword } from './password';

const ALPHABET = /^[A-Za-z0-9]+$/;

describe('randomPassword', () => {
  it('defaults to 24 characters', () => {
    expect(randomPassword()).toHaveLength(24);
  });

  it('honours a requested length', () => {
    expect(randomPassword(12)).toHaveLength(12);
    expect(randomPassword(40)).toHaveLength(40);
  });

  it('draws only from A-Z a-z 0-9', () => {
    for (let i = 0; i < 50; i++) {
      expect(randomPassword(32)).toMatch(ALPHABET);
    }
  });

  it('does not return the same value twice in a row', () => {
    expect(randomPassword()).not.toBe(randomPassword());
  });
});
