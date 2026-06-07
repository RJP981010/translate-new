import { useCallback, useRef, useState } from 'react';
import { parseLookupResult } from '../lib/siliconflow/parser';
import { detectLookupMode } from '../lib/selection';
import { LOOKUP_STREAM_PORT } from '../lib/messaging';
import { sanitizeRichText } from '../lib/richText';
import { appendLookupChunk, shouldAcceptLookupMessage } from '../lib/lookupStreamState';
import type {
  LookupMode,
  LookupResult,
  LookupStreamMessage,
  LookupStreamState,
} from '../types/lookup';

const initialState = (mode: LookupMode): LookupStreamState => ({
  status: 'idle',
  mode,
  buffer: '',
  safeHtml: '',
  hasFirstChunk: false,
  result: null,
  requestId: null,
  selectionId: null,
});

export function useLookupStream() {
  const [state, setState] = useState<LookupStreamState>(initialState('dictionary'));
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const selectionIdRef = useRef<string | null>(null);

  const cancel = useCallback(() => {
    const id = requestIdRef.current;
    const selectionId = selectionIdRef.current;
    if (portRef.current && id) {
      portRef.current.postMessage({
        type: 'cancel',
        requestId: id,
        ...(selectionId ? { selectionId } : {}),
      });
    }
    portRef.current?.disconnect();
    portRef.current = null;
    requestIdRef.current = null;
    selectionIdRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState(initialState('dictionary'));
  }, [cancel]);

  const start = useCallback(
    (text: string, selectionId: string, sentence?: string) => {
      cancel();
      const mode = detectLookupMode(text);
      const requestId = crypto.randomUUID();
      requestIdRef.current = requestId;
      selectionIdRef.current = selectionId;

      setState({
        status: 'loading',
        mode,
        buffer: '',
        safeHtml: '',
        hasFirstChunk: false,
        result: null,
        requestId,
        selectionId,
      });

      const port = chrome.runtime.connect({ name: LOOKUP_STREAM_PORT });
      portRef.current = port;

      port.onMessage.addListener((msg: LookupStreamMessage) => {
        if (!shouldAcceptLookupMessage(msg, requestId, selectionId)) return;

        if (msg.type === 'chunk') {
          setState((s) => {
            const { buffer, safeHtml } = appendLookupChunk(s.buffer, msg.delta);
            return {
              ...s,
              status: 'streaming',
              hasFirstChunk: true,
              buffer,
              safeHtml,
            };
          });
          return;
        }

        if (msg.type === 'done') {
          setState((s) => ({
            ...s,
            status: 'success',
            hasFirstChunk: true,
            result:
              s.mode === 'dictionary'
                ? resolveDictionaryResult(text, s.buffer, msg.data)
                : buildTranslationResult(text, s.buffer, s.safeHtml),
          }));
          port.disconnect();
          portRef.current = null;
          return;
        }

        if (msg.type === 'error') {
          setState((s) => ({
            ...s,
            status: msg.code === 'CONFIG_MISSING' ? 'config_missing' : 'error',
            errorMessage: msg.message,
            errorCode: msg.code,
          }));
          port.disconnect();
          portRef.current = null;
        }
      });

      port.onDisconnect.addListener(() => {
        portRef.current = null;
      });

      port.postMessage({ type: 'start', text, requestId, selectionId, mode, sentence });
    },
    [cancel],
  );

  return { state, start, cancel, reset };
}

function resolveDictionaryResult(
  text: string,
  buffer: string,
  fromBackground?: LookupResult | null,
): LookupResult | null {
  console.log('[translator:parse:content] buffer before parse:', buffer);
  const fromBuffer = parseLookupResult(buffer, text, 'content');
  if (fromBuffer) return fromBuffer;

  const isParseFailure =
    fromBackground?.definitions.length === 1 &&
    fromBackground.definitions[0].meanings[0] === '解析失败，请重试';

  if (fromBackground && !isParseFailure) return fromBackground;
  return fromBackground ?? null;
}

function buildTranslationResult(text: string, buffer: string, safeHtml?: string): LookupResult {
  const meaning = sanitizeRichText(buffer).plainTextFallback || buffer.trim();
  return {
    word: text,
    primaryMeaning: meaning,
    ...(safeHtml ? { richHtml: safeHtml } : {}),
    definitions: [
      {
        pos: '译',
        meanings: [meaning],
      },
    ],
  };
}
