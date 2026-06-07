const ALLOWED_TAGS = new Set(['div', 'p', 'span', 'ul', 'ol', 'li', 'strong', 'em', 'br']);

const ALLOWED_CLASSES = new Set([
  'space-y-1',
  'space-y-2',
  'space-y-3',
  'text-xs',
  'text-sm',
  'text-base',
  'font-medium',
  'font-semibold',
  'font-bold',
  'leading-relaxed',
  'text-gray-500',
  'text-gray-600',
  'text-gray-700',
  'text-gray-900',
  'text-blue-600',
  'text-emerald-600',
  'mt-1',
  'mt-2',
  'mb-1',
  'mb-2',
  'pl-4',
  'list-disc',
  'list-decimal',
]);

export interface SanitizedRichText {
  safeHtml: string;
  plainTextFallback: string;
  status: 'clean' | 'stripped' | 'fallback';
}

function sanitizeClassAttribute(rawAttrs: string): string {
  const classMatch = rawAttrs.match(/\sclass\s*=\s*["']([^"']*)["']/i);
  if (!classMatch) return '';
  const classes = classMatch[1]
    .split(/\s+/)
    .filter((token) => ALLOWED_CLASSES.has(token));
  return classes.length ? ` class="${classes.join(' ')}"` : '';
}

function sanitizeWithoutDomParser(raw: string): SanitizedRichText {
  const strippedBlocks = stripDangerousBlocks(raw);
  let stripped = strippedBlocks !== raw;
  let plainTextFallback = '';
  let safeHtml = '';
  let cursor = 0;

  for (const match of strippedBlocks.matchAll(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi)) {
    const index = match.index ?? 0;
    const text = strippedBlocks.slice(cursor, index);
    safeHtml += escapeHtml(text);
    plainTextFallback += text;

    const fullTag = match[0];
    const tag = match[1].toLowerCase();
    const attrs = match[2] ?? '';
    const isClosing = fullTag.startsWith('</');

    if (ALLOWED_TAGS.has(tag)) {
      if (isClosing) {
        safeHtml += `</${tag}>`;
      } else if (tag === 'br') {
        safeHtml += '<br>';
      } else {
        const safeClass = sanitizeClassAttribute(attrs);
        if (safeClass.length !== attrs.trim().length + (attrs.trim() ? 1 : 0)) stripped = true;
        safeHtml += `<${tag}${safeClass}>`;
      }
    } else {
      stripped = true;
    }

    cursor = index + fullTag.length;
  }

  const rest = strippedBlocks.slice(cursor);
  safeHtml += escapeHtml(rest);
  plainTextFallback += rest;

  safeHtml = safeHtml.trim();
  plainTextFallback = plainTextFallback.trim();

  return {
    safeHtml,
    plainTextFallback,
    status: safeHtml ? (stripped ? 'stripped' : 'clean') : 'fallback',
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripDangerousBlocks(value: string): string {
  return value.replace(/<\s*(script|style|iframe)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
}

function sanitizeWithDomParser(raw: string): SanitizedRichText | null {
  if (typeof DOMParser === 'undefined' || typeof document === 'undefined') return null;

  const strippedBlocks = stripDangerousBlocks(raw);
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${strippedBlocks}</div>`, 'text/html');
  let stripped = strippedBlocks !== raw;

  const sanitizeNode = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent ?? '');
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      stripped = true;
      const fragment = document.createDocumentFragment();
      for (const child of [...element.childNodes]) {
        const safeChild = sanitizeNode(child);
        if (safeChild) fragment.appendChild(safeChild);
      }
      return fragment;
    }

    const safeElement = document.createElement(tag);
    const classes = (element.getAttribute('class') ?? '')
      .split(/\s+/)
      .filter((token) => ALLOWED_CLASSES.has(token));

    if (classes.length) safeElement.setAttribute('class', classes.join(' '));
    if (classes.join(' ') !== (element.getAttribute('class') ?? '').trim()) stripped = true;

    for (const attr of [...element.attributes]) {
      if (attr.name !== 'class') stripped = true;
    }

    for (const child of [...element.childNodes]) {
      const safeChild = sanitizeNode(child);
      if (safeChild) safeElement.appendChild(safeChild);
    }

    return safeElement;
  };

  const container = document.createElement('div');
  for (const child of [...(doc.body.firstElementChild?.childNodes ?? [])]) {
    const safeChild = sanitizeNode(child);
    if (safeChild) container.appendChild(safeChild);
  }

  const safeHtml = container.innerHTML.trim();
  const plainTextFallback = (container.textContent ?? '').trim();

  if (!safeHtml && plainTextFallback) {
    return {
      safeHtml: escapeHtml(plainTextFallback),
      plainTextFallback,
      status: 'fallback',
    };
  }

  return {
    safeHtml,
    plainTextFallback,
    status: safeHtml ? (stripped ? 'stripped' : 'clean') : 'fallback',
  };
}

export function sanitizeRichText(raw: string): SanitizedRichText {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { safeHtml: '', plainTextFallback: '', status: 'fallback' };
  }

  const domResult = sanitizeWithDomParser(trimmed);
  if (domResult) return domResult;

  return sanitizeWithoutDomParser(trimmed);
}
