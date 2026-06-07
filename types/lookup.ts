export type LookupMode = 'dictionary' | 'translation';

export type LookupStatus =
  | 'idle'
  | 'loading'
  | 'streaming'
  | 'success'
  | 'error'
  | 'empty'
  | 'config_missing';

export interface Example {
  en: string;
  zh?: string;
}

export interface Definition {
  pos: string;
  meanings: string[];
  example?: Example;
}

export interface LookupResult {
  word: string;
  phonetic?: string;
  primaryMeaning: string;
  contextMeaning?: string;
  definitions: Definition[];
  pronunciation?: PronunciationInfo;
  richHtml?: string;
}

export interface PronunciationInfo {
  available: boolean;
  label?: string;
  lang?: string;
}

export interface LookupStreamState {
  status: LookupStatus;
  mode: LookupMode;
  buffer: string;
  safeHtml?: string;
  hasFirstChunk: boolean;
  result: LookupResult | null;
  errorMessage?: string;
  errorCode?: string;
  requestId: string | null;
  selectionId: string | null;
}

export type LookupErrorCode =
  | 'CONFIG_MISSING'
  | 'INVALID_SELECTION'
  | 'API_ERROR'
  | 'PARSE_ERROR'
  | 'SANITIZE_EMPTY';

export interface LookupStreamStart {
  type: 'start';
  text: string;
  requestId: string;
  selectionId: string;
  mode: LookupMode;
  sentence?: string;
}

export interface LookupStreamCancel {
  type: 'cancel';
  requestId: string;
  selectionId?: string;
}

export interface LookupStreamChunk {
  type: 'chunk';
  requestId: string;
  selectionId: string;
  delta: string;
  format: 'text' | 'html';
}

export interface LookupStreamDone {
  type: 'done';
  requestId: string;
  selectionId: string;
  data?: LookupResult;
}

export interface LookupStreamError {
  type: 'error';
  requestId: string;
  selectionId: string;
  code: LookupErrorCode;
  message: string;
}

export type LookupStreamMessage =
  | LookupStreamStart
  | LookupStreamCancel
  | LookupStreamChunk
  | LookupStreamDone
  | LookupStreamError;
