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
  zh: string;
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
  definitions: Definition[];
}

export interface LookupStreamState {
  status: LookupStatus;
  mode: LookupMode;
  buffer: string;
  hasFirstChunk: boolean;
  result: LookupResult | null;
  errorMessage?: string;
  errorCode?: string;
  requestId: string | null;
}

export type LookupErrorCode =
  | 'CONFIG_MISSING'
  | 'INVALID_SELECTION'
  | 'API_ERROR'
  | 'PARSE_ERROR';

export interface LookupStreamStart {
  type: 'start';
  text: string;
  requestId: string;
  mode: LookupMode;
}

export interface LookupStreamCancel {
  type: 'cancel';
  requestId: string;
}

export interface LookupStreamChunk {
  type: 'chunk';
  requestId: string;
  delta: string;
}

export interface LookupStreamDone {
  type: 'done';
  requestId: string;
  data?: LookupResult;
}

export interface LookupStreamError {
  type: 'error';
  requestId: string;
  code: LookupErrorCode;
  message: string;
}

export type LookupStreamMessage =
  | LookupStreamStart
  | LookupStreamCancel
  | LookupStreamChunk
  | LookupStreamDone
  | LookupStreamError;
