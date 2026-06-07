import { z } from 'zod';
import type { Definition, LookupResult, PronunciationInfo } from '../../types/lookup';

const exampleSchema = z.object({
  en: z.string(),
  zh: z.string().optional().default(''),
});

const definitionSchema = z.object({
  pos: z.string().min(1),
  meanings: z.array(z.string()).min(1),
  example: exampleSchema.optional(),
});

const pronunciationSchema = z.object({
  available: z.boolean(),
  label: z.string().optional(),
  lang: z.string().optional(),
});

export const lookupResultSchema = z.object({
  word: z.string().min(1),
  phonetic: z.string().optional(),
  primaryMeaning: z.string().min(1),
  contextMeaning: z.string().optional(),
  definitions: z.array(definitionSchema).min(1),
  pronunciation: pronunciationSchema.optional(),
  richHtml: z.string().optional(),
});

type RawRecord = Record<string, unknown>;

function takeLeadingPayload(raw: string): string {
  return raw.split(/`{3,}/)[0].trim();
}

function stripCodeFences(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : raw).trim();
}

function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }

  return null;
}

function matchJsonString(raw: string, key: string): string | null {
  const marker = `"${key}"`;
  const idx = raw.indexOf(marker);
  if (idx < 0) return null;

  let i = raw.indexOf(':', idx + marker.length);
  if (i < 0) return null;
  i++;

  while (i < raw.length && /\s/.test(raw[i])) i++;
  if (raw[i] !== '"') return null;
  i++;

  let value = '';
  let escaped = false;
  while (i < raw.length) {
    const ch = raw[i];
    if (escaped) {
      value += ch;
      escaped = false;
      i++;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      i++;
      continue;
    }
    if (ch === '"') return value;
    value += ch;
    i++;
  }

  return null;
}

function extractStringArrayLiteral(raw: string, key: string): string[] {
  const marker = `"${key}"`;
  const idx = raw.indexOf(marker);
  if (idx < 0) return [];

  const open = raw.indexOf('[', idx + marker.length);
  const close = raw.indexOf(']', open + 1);
  if (open < 0 || close < 0) return [];

  const inner = raw.slice(open + 1, close);
  return [...inner.matchAll(/"((?:[^"\\]|\\.)*)"/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function extractDefinitionsFromChunk(chunk: string): Definition[] {
  const definitions: Definition[] = [];
  const regex =
    /"pos"\s*:\s*"([^"]+)"\s*,\s*"meanings"\s*:\s*\[((?:[^\]]|\](?!\s*[,}]))*)\]/g;

  for (const match of chunk.matchAll(regex)) {
    const meanings = [...match[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)]
      .map((item) => item[1].trim())
      .filter(Boolean);
    if (!meanings.length) continue;
    definitions.push({ pos: match[1], meanings });
  }

  return definitions;
}

function extractLooseExample(chunk: string): Definition['example'] | undefined {
  const nested = chunk.match(
    /"example"\s*:\s*\{\s*"en"\s*:\s*"((?:[^"\\]|\\.)*)"(?:\s*,\s*"zh"\s*:\s*"((?:[^"\\]|\\.)*)")?/,
  );
  if (nested) {
    return { en: nested[1], zh: nested[2] ?? '' };
  }

  const loose = chunk.match(/"example"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (loose) {
    return { en: loose[1], zh: '' };
  }

  return undefined;
}

function cleanMeanings(definitions: Definition[]): Definition[] {
  return definitions.map((def) => ({
    ...def,
    meanings: def.meanings
      .flatMap((meaning) => toStringArray(meaning))
      .map((meaning) => meaning.replace(new RegExp(`^${escapeRegExp(def.pos)}\\s*`), '').trim() || meaning)
      .filter(Boolean),
  }));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRepairedJson(chunk: string): string | null {
  const word = matchJsonString(chunk, 'word');
  const phonetic = matchJsonString(chunk, 'phonetic');
  const contextMeaning = matchJsonString(chunk, 'contextMeaning');
  const richHtml = matchJsonString(chunk, 'richHtml');
  const primaryMeaning =
    matchJsonString(chunk, 'primaryMeaning') ?? matchJsonString(chunk, 'meaning');
  const definitions = extractDefinitionsFromChunk(chunk);

  if (!word || !primaryMeaning || !definitions.length) return null;

  const example = extractLooseExample(chunk);
  if (example && !definitions[0].example) {
    definitions[0] = { ...definitions[0], example };
  }

  return JSON.stringify({
    word,
    ...(phonetic ? { phonetic } : {}),
    primaryMeaning,
    ...(contextMeaning ? { contextMeaning } : {}),
    definitions: cleanMeanings(definitions),
    ...(richHtml ? { richHtml } : {}),
  });
}

function salvageLookupResult(raw: string, fallbackWord?: string): LookupResult | null {
  const chunk = takeLeadingPayload(stripCodeFences(raw));
  const word = matchJsonString(chunk, 'word') ?? fallbackWord?.trim() ?? '';
  const phonetic = matchJsonString(chunk, 'phonetic') ?? undefined;
  const contextMeaning = matchJsonString(chunk, 'contextMeaning') ?? undefined;
  const richHtml = matchJsonString(chunk, 'richHtml') ?? undefined;
  const primaryMeaning =
    matchJsonString(chunk, 'primaryMeaning') ??
    matchJsonString(chunk, 'meaning') ??
    matchJsonString(chunk, 'translation') ??
    '';

  let definitions = cleanMeanings(extractDefinitionsFromChunk(chunk));
  const example = extractLooseExample(chunk);
  if (example && definitions[0] && !definitions[0].example) {
    definitions[0] = { ...definitions[0], example };
  }

  if (!definitions.length) {
    const looseMeanings = extractStringArrayLiteral(chunk, 'meanings');
    if (looseMeanings.length) {
      definitions = [{ pos: '—', meanings: looseMeanings }];
    }
  }

  const resolvedPrimary =
    primaryMeaning || definitions[0]?.meanings.join('；') || '';

  if (!word || !resolvedPrimary || !definitions.length) return null;

  return normalizeLookupPayload(
    {
      word,
      ...(phonetic ? { phonetic } : {}),
      ...(contextMeaning ? { contextMeaning } : {}),
      primaryMeaning: resolvedPrimary,
      definitions,
      ...(richHtml ? { richHtml } : {}),
    },
    fallbackWord,
  );
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[；;、,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeExample(value: unknown): Definition['example'] | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as RawRecord;
  if (typeof record.en === 'string') {
    return {
      en: record.en.trim(),
      zh: typeof record.zh === 'string' ? record.zh.trim() : '',
    };
  }
  if (typeof record.example === 'string') {
    return { en: record.example.trim(), zh: '' };
  }
  return undefined;
}

function normalizeDefinition(value: unknown): Definition | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as RawRecord;
  const meanings = toStringArray(record.meanings ?? record.meaning);
  if (!meanings.length) return null;

  const pos =
    (typeof record.pos === 'string' && record.pos.trim()) ||
    (typeof record.partOfSpeech === 'string' && record.partOfSpeech.trim()) ||
    (typeof record.type === 'string' && record.type.trim()) ||
    '—';

  return {
    pos,
    meanings,
    example: normalizeExample(record.example),
  };
}

function normalizeDefinitions(value: unknown): Definition[] {
  if (Array.isArray(value)) {
    return value.map(normalizeDefinition).filter((item): item is Definition => item !== null);
  }
  const single = normalizeDefinition(value);
  return single ? [single] : [];
}

function normalizePronunciation(value: unknown, word: string): PronunciationInfo | undefined {
  if (value && typeof value === 'object') {
    const record = value as RawRecord;
    return {
      available: typeof record.available === 'boolean' ? record.available : true,
      label: typeof record.label === 'string' ? record.label.trim() : '播放发音',
      lang: typeof record.lang === 'string' ? record.lang.trim() : 'en-US',
    };
  }

  if (typeof value === 'string' && value.trim()) {
    return {
      available: true,
      label: '播放发音',
      lang: 'en-US',
    };
  }

  if (/^[a-z][a-z\s'-]*$/i.test(word)) {
    return {
      available: true,
      label: '播放发音',
      lang: 'en-US',
    };
  }

  return undefined;
}

function normalizeLookupPayload(value: unknown, fallbackWord?: string): LookupResult | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as RawRecord;

  const definitions = cleanMeanings(
    normalizeDefinitions(record.definitions ?? record.definition),
  );
  if (!definitions.length) return null;

  const primaryMeaning =
    (typeof record.primaryMeaning === 'string' && record.primaryMeaning.trim()) ||
    (typeof record.meaning === 'string' && record.meaning.trim()) ||
    (typeof record.translation === 'string' && record.translation.trim()) ||
    definitions[0].meanings.join('；') ||
    '';

  const word =
    (typeof record.word === 'string' && record.word.trim()) ||
    fallbackWord?.trim() ||
    '';

  if (!word || !primaryMeaning) return null;

  const phonetic =
    typeof record.phonetic === 'string'
      ? record.phonetic.trim()
      : typeof record.pronunciation === 'string'
        ? record.pronunciation.trim()
        : undefined;
  const contextMeaning =
    typeof record.contextMeaning === 'string' ? record.contextMeaning.trim() : undefined;
  const richHtml = typeof record.richHtml === 'string' ? record.richHtml.trim() : undefined;
  const pronunciation = normalizePronunciation(record.pronunciation, word);

  const normalized: LookupResult = {
    word,
    primaryMeaning,
    definitions,
    ...(phonetic ? { phonetic } : {}),
    ...(contextMeaning ? { contextMeaning } : {}),
    ...(pronunciation ? { pronunciation } : {}),
    ...(richHtml ? { richHtml } : {}),
  };

  try {
    return lookupResultSchema.parse(normalized);
  } catch {
    return null;
  }
}

export function parseLookupResult(
  raw: string,
  fallbackWord?: string,
  source: 'background' | 'content' = 'background',
): LookupResult | null {
  console.log(`[translator:parse:${source}] raw text:`, raw);
  console.log(`[translator:parse:${source}] fallback word:`, fallbackWord ?? '(none)');

  const leading = takeLeadingPayload(raw.trim());
  const cleaned = stripCodeFences(leading);
  const candidates = [
    cleaned,
    extractJsonObject(cleaned),
    buildRepairedJson(cleaned),
  ].filter((item): item is string => Boolean(item));

  const uniqueCandidates = [...new Set(candidates)];

  for (const candidate of uniqueCandidates) {
    console.log(`[translator:parse:${source}] candidate:`, candidate);
    try {
      const parsed = normalizeLookupPayload(JSON.parse(candidate), fallbackWord);
      if (parsed) {
        console.log(`[translator:parse:${source}] success:`, parsed);
        return parsed;
      }
      console.warn(`[translator:parse:${source}] normalize returned null`);
    } catch (err) {
      console.warn(`[translator:parse:${source}] JSON.parse failed:`, err);
    }
  }

  const salvaged = salvageLookupResult(raw, fallbackWord);
  if (salvaged) {
    console.log(`[translator:parse:${source}] salvaged:`, salvaged);
    return salvaged;
  }

  console.warn(`[translator:parse:${source}] all candidates failed`);
  return null;
}

export function buildFallbackResult(text: string, buffer: string): LookupResult {
  const parsed = parseLookupResult(buffer, text);
  if (parsed) return parsed;

  return {
    word: text,
    primaryMeaning: '暂无释义',
    definitions: [
      {
        pos: '—',
        meanings: ['解析失败，请重试'],
      },
    ],
  };
}
