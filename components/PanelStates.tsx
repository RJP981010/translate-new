import { AlertCircle, Loader2, Settings } from 'lucide-react';

interface PanelStatesProps {
  status: string;
  buffer: string;
  safeHtml?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onOpenSettings?: () => void;
  emptyMessage?: string | null;
}

export function PanelStates({
  status,
  buffer,
  safeHtml,
  errorMessage,
  onRetry,
  onOpenSettings,
  emptyMessage,
}: PanelStatesProps) {
  if (emptyMessage) {
    return (
      <div className="flex items-center gap-2 px-4 py-6 text-sm text-gray-500">
        <AlertCircle size={16} />
        {emptyMessage}
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-gray-500">
        <Loader2 size={18} className="animate-spin text-blue-500" />
        正在查询…
      </div>
    );
  }

  if (status === 'config_missing') {
    return (
      <div className="space-y-3 px-4 py-6 text-sm text-gray-600">
        <p>请先配置硅基流动 API Key</p>
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
        >
          <Settings size={14} />
          打开设置
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-3 px-4 py-6 text-sm text-gray-600">
        <p className="text-red-600">{errorMessage ?? '查询失败'}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
          >
            重试
          </button>
        )}
      </div>
    );
  }

  if (status === 'streaming' && (safeHtml || buffer)) {
    return (
      <div className="whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-gray-800">
        {safeHtml ? (
          <div className="translator-rich-text" dangerouslySetInnerHTML={{ __html: safeHtml }} />
        ) : (
          buffer
        )}
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-blue-500" />
      </div>
    );
  }

  return null;
}
