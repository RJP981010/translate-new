import { describe, expect, it } from 'vitest';
import {
  countWords,
  detectLookupMode,
  trimSelection,
  validateSelection,
} from '../../lib/selection';

describe('selection', () => {
  it('trims whitespace', () => {
    expect(trimSelection('  hello   world  ')).toBe('hello world');
  });

  it('counts words', () => {
    expect(countWords('one two three')).toBe(3);
  });

  it('detects dictionary mode for short selection', () => {
    expect(detectLookupMode('welcome')).toBe('dictionary');
    expect(detectLookupMode('one two three four five')).toBe('dictionary');
  });

  it('detects translation mode for long selection', () => {
    expect(detectLookupMode('one two three four five six')).toBe('translation');
  });

  it('rejects empty and invalid', () => {
    expect(validateSelection('   ').ok).toBe(false);
    expect(validateSelection('12345').ok).toBe(false);
    expect(validateSelection('!!!').ok).toBe(false);
  });

  it('accepts valid text', () => {
    const result = validateSelection('hello');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toBe('hello');
      expect(result.mode).toBe('dictionary');
    }
  });

  it('rejects too long text', () => {
    expect(validateSelection('a'.repeat(501)).ok).toBe(false);
  });
});
