import type { LookupMode } from '../types/lookup';

export const MAX_SELECTION_LENGTH = 1000;
const DICTIONARY_MAX_WORDS = 5;
const SENTENCE_BOUNDARY = /[.!?。！？；;]\s*/;

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
  if (text.length > MAX_SELECTION_LENGTH) return { ok: false, reason: 'too_long' };
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

export function extractCurrentSentence(rawText: string, selectedText: string): string | undefined {
  const normalizedText = trimSelection(rawText);
  const normalizedSelection = trimSelection(selectedText);
  if (!normalizedText || !normalizedSelection) return undefined;

  const selectionIndex = normalizedText.toLowerCase().indexOf(normalizedSelection.toLowerCase());
  if (selectionIndex < 0) return undefined;

  let start = 0;
  for (let i = selectionIndex - 1; i >= 0; i--) {
    if (SENTENCE_BOUNDARY.test(normalizedText[i])) {
      start = i + 1;
      break;
    }
  }

  let end = normalizedText.length;
  for (let i = selectionIndex + normalizedSelection.length; i < normalizedText.length; i++) {
    if (SENTENCE_BOUNDARY.test(normalizedText[i])) {
      end = i + 1;
      break;
    }
  }

  const sentence = trimSelection(normalizedText.slice(start, end));
  return sentence.includes(normalizedSelection) ? sentence : undefined;
}

export function getCurrentSentenceForSelection(): string | undefined {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return undefined;

  const selectedText = selection.toString();
  const anchor = selection.anchorNode;
  const containerText = anchor?.parentElement?.textContent ?? anchor?.textContent ?? '';
  return extractCurrentSentence(containerText, selectedText);
}
