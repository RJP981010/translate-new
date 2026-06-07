import type { LookupMode } from '../types/lookup';

const MAX_LENGTH = 500;
const DICTIONARY_MAX_WORDS = 5;

export type SelectionValidation =
  | { ok: true; text: string; mode: LookupMode; wordCount: number }
  | { ok: false; reason: 'empty' | 'too_long' | 'invalid' };

export function trimSelection(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function countWords(text: string): number {
  const trimmed = trimSelection(text);
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function detectLookupMode(text: string): LookupMode {
  return countWords(text) <= DICTIONARY_MAX_WORDS ? 'dictionary' : 'translation';
}

export function isMostlyChinese(text: string): boolean {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  return cjk > text.length * 0.3;
}

const INVALID_ONLY = /^[\d\s\p{P}\p{S}]+$/u;

export function validateSelection(raw: string): SelectionValidation {
  const text = trimSelection(raw);
  if (!text) return { ok: false, reason: 'empty' };
  if (text.length > MAX_LENGTH) return { ok: false, reason: 'too_long' };
  if (INVALID_ONLY.test(text)) return { ok: false, reason: 'invalid' };
  return {
    ok: true,
    text,
    mode: detectLookupMode(text),
    wordCount: countWords(text),
  };
}

export function getSelectionRect(): DOMRect | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  return range.getBoundingClientRect();
}

export function getSelectedText(): string {
  return window.getSelection()?.toString() ?? '';
}
