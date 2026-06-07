import { Settings, Volume2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { canSpeak, speakWord, stopSpeaking } from '../lib/audio';
import { sanitizeRichText } from '../lib/richText';
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
  contentMaxHeight?: number;
  originalMaxHeight?: number;
}

function DictionaryView({ result }: { result: LookupResult }) {
  const [audioMessage, setAudioMessage] = useState<string | null>(null);
  const pronunciationAvailable = result.pronunciation?.available ?? canSpeak();
  const lang = result.pronunciation?.lang ?? 'en-US';
  const contextMeaning = result.contextMeaning
    ?.replace(/^(文中含义|在文中|在当前句子中(?:的意思)?)(?:指|表示|是|为)?[：:，,。\s]*/u, '')
    .trim();

  const handleSpeak = async () => {
    try {
      setAudioMessage(null);
      await speakWord(result.word, lang);
    } catch (err) {
      setAudioMessage(err instanceof Error ? err.message : '发音播放失败');
    }
  };

  return (
    <>
      <div className="space-y-2 px-4 py-2">
        <div className="flex items-center gap-2">
          {result.phonetic && (
            <span className="text-xs text-gray-400">{result.phonetic}</span>
          )}
          <span className="text-sm font-semibold text-gray-900">{result.primaryMeaning}</span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSpeak}
            disabled={!pronunciationAvailable}
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Volume2 size={13} />
            {result.pronunciation?.label ?? '播放发音'}
          </button>
        </div>
        {!pronunciationAvailable && (
          <p className="text-xs text-gray-400">{result.pronunciation?.label ?? '当前浏览器不支持发音播放'}</p>
        )}
        {audioMessage && <p className="text-xs text-red-500">{audioMessage}</p>}
      </div>
      <div className="px-4 pb-3">
        <DefinitionList definitions={result.definitions} />
      </div>
      <div className="border-t border-gray-100 px-4 py-3">
        {contextMeaning ? (
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-900">
            {contextMeaning}
          </div>
        ) : (
          <p className="text-xs text-gray-400">未取得当前句子，先显示通用释义。</p>
        )}
      </div>
    </>
  );
}

function TranslationView({ result, buffer }: { result: LookupResult | null; buffer: string }) {
  const text = result?.primaryMeaning ?? buffer;
  const safeHtml = result?.richHtml ? sanitizeRichText(result.richHtml).safeHtml : '';
  return (
    <div className="space-y-2 px-4 py-3">
      <p className="text-xs text-gray-400">译文</p>
      {safeHtml ? (
        <div
          className="translator-rich-text text-xs leading-relaxed text-gray-900"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-900">{text}</p>
      )}
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
  contentMaxHeight = Math.max(120, maxHeight - 188),
  originalMaxHeight = 160,
}: LookupPanelProps) {
  const [originalExpanded, setOriginalExpanded] = useState(false);
  const isLongOriginal = selectedText.length > 80;

  useEffect(() => {
    return () => stopSpeaking();
  }, [selectedText]);

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
      data-translator-panel
      className="w-[440px] overflow-hidden rounded-xl border border-gray-200 bg-white font-sans shadow-xl"
      style={{ ...style, maxHeight }}
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
        <div
          className="text-base font-bold tracking-tight text-gray-900"
          style={{
            maxHeight: originalExpanded ? originalMaxHeight : undefined,
            overflowY: originalExpanded ? 'auto' : undefined,
          }}
        >
          {originalExpanded || !isLongOriginal ? selectedText : `${selectedText.slice(0, 80)}...`}
        </div>
        {isLongOriginal && (
          <button
            type="button"
            onClick={() => setOriginalExpanded((value) => !value)}
            className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {originalExpanded ? '收起原文' : '展开原文'}
          </button>
        )}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-900" />
          AI 查词
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: contentMaxHeight }}>
        {(showStates || showDictionaryLoading) && (
          <PanelStates
            status={showDictionaryLoading ? 'loading' : stream.status}
            buffer={stream.buffer}
            safeHtml={stream.safeHtml}
            errorMessage={stream.errorMessage}
            onRetry={onRetry}
            onOpenSettings={onOpenSettings}
          />
        )}

        {showStreamingOnly && !showStates && !showDictionaryLoading && (
          <PanelStates status="streaming" buffer={stream.buffer} safeHtml={stream.safeHtml} />
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
