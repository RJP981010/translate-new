import { describe, expect, it } from 'vitest';
import {
  MAX_SELECTION_LENGTH,
  countWords,
  detectLookupMode,
  extractCurrentSentence,
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
    expect(validateSelection('a'.repeat(MAX_SELECTION_LENGTH)).ok).toBe(true);
    expect(validateSelection('a'.repeat(MAX_SELECTION_LENGTH + 1)).ok).toBe(false);
  });

  it('extracts current sentence around selected text', () => {
    const sentence = extractCurrentSentence(
      'First sentence. She built a strong network in the industry. Last sentence.',
      'network',
    );
    expect(sentence).toBe('She built a strong network in the industry.');
  });

  it('falls back when current sentence cannot be resolved', () => {
    expect(extractCurrentSentence('No matching text here.', 'network')).toBeUndefined();
  });

  it('keeps punctuation-only and blank selections invalid', () => {
    expect(validateSelection('，！？').ok).toBe(false);
    expect(validateSelection('\n\t').ok).toBe(false);
  });
});
