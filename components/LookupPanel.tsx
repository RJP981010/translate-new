import { Settings, X } from 'lucide-react';
import type { LookupResult, LookupStreamState } from '../types/lookup';
import { DefinitionList } from './DefinitionList';
import { PanelStates } from './PanelStates';

interface LookupPanelProps {
  selectedText: string;
  stream: LookupStreamState;
  onClose: () => void;
  onRetry: () => void;
  onOpenSettings: () => void;
  style: React.CSSProperties;
  maxHeight?: number;
}

function DictionaryView({ result }: { result: LookupResult }) {
  return (
    <>
      <div className="flex items-baseline gap-2 px-4 py-2">
        {result.phonetic && (
          <span className="text-sm text-gray-400">{result.phonetic}</span>
        )}
        <span className="text-base font-semibold text-gray-900">{result.primaryMeaning}</span>
      </div>
      <div className="px-4 pb-4">
        <DefinitionList definitions={result.definitions} />
      </div>
    </>
  );
}

function TranslationView({ result, buffer }: { result: LookupResult | null; buffer: string }) {
  const text = result?.primaryMeaning ?? buffer;
  return (
    <div className="space-y-2 px-4 py-3">
      <p className="text-xs text-gray-400">译文</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">{text}</p>
    </div>
  );
}

export function LookupPanel({
  selectedText,
  stream,
  onClose,
  onRetry,
  onOpenSettings,
  style,
  maxHeight = 420,
}: LookupPanelProps) {
  const showStructured =
    stream.status === 'success' &&
    (stream.mode === 'dictionary' ? stream.result : true);

  const showStreamingOnly =
    (stream.status === 'streaming' && stream.mode === 'translation') ||
    (stream.status === 'success' && stream.mode === 'translation' && !stream.result);

  const showDictionaryLoading =
    stream.status === 'loading' ||
    (stream.status === 'streaming' && stream.mode === 'dictionary');

  const showStates =
    stream.status === 'loading' ||
    stream.status === 'error' ||
    stream.status === 'config_missing';

  return (
    <div
      className="w-[360px] overflow-hidden rounded-xl border border-gray-200 bg-white font-sans shadow-xl"
      style={{ ...style, maxHeight }}
      onMouseLeave={(e) => {
        const related = e.relatedTarget as Node | null;
        if (!e.currentTarget.contains(related)) onClose();
      }}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <span className="text-[10px] font-medium tracking-widest text-gray-400">TRANSLATOR</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="设置"
          >
            <Settings size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="关闭"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{selectedText}</h2>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-900" />
          AI 查词
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: maxHeight - 120 }}>
        {(showStates || showDictionaryLoading) && (
          <PanelStates
            status={showDictionaryLoading ? 'loading' : stream.status}
            buffer={stream.buffer}
            errorMessage={stream.errorMessage}
            onRetry={onRetry}
            onOpenSettings={onOpenSettings}
          />
        )}

        {showStreamingOnly && !showStates && !showDictionaryLoading && (
          <PanelStates status="streaming" buffer={stream.buffer} />
        )}

        {showStructured && stream.mode === 'dictionary' && stream.result && (
          <DictionaryView result={stream.result} />
        )}

        {showStructured && stream.mode === 'translation' && stream.status === 'success' && (
          <TranslationView result={stream.result} buffer={stream.buffer} />
        )}
      </div>
    </div>
  );
}
