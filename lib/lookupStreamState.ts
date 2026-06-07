import type { LookupStreamMessage } from '../types/lookup';
import { sanitizeRichText } from './richText';

export function shouldAcceptLookupMessage(
  msg: Pick<LookupStreamMessage, 'requestId'> & { selectionId?: string },
  requestId: string,
  selectionId: string,
): boolean {
  return msg.requestId === requestId && msg.selectionId === selectionId;
}

export function appendLookupChunk(buffer: string, delta: string): { buffer: string; safeHtml: string } {
  const nextBuffer = buffer + delta;
  return {
    buffer: nextBuffer,
    safeHtml: sanitizeRichText(nextBuffer).safeHtml,
  };
}
