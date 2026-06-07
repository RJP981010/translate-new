import { useEffect, useState } from 'react';
import { sendMessage } from '../../lib/messaging';
import { DEFAULT_MODEL } from '../../types/settings';

export function App() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void sendMessage('getSettings', undefined).then((res) => {
      setHasApiKey(res.hasApiKey);
      setModel(res.model);
    });
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSave = async () => {
    const res = await sendMessage('saveSettings', {
      ...(apiKey.trim() ? { siliconflowApiKey: apiKey.trim() } : {}),
      model: model.trim() || DEFAULT_MODEL,
    });
    if (res.ok) {
      setHasApiKey(apiKey.trim().length > 0 || hasApiKey);
      setApiKey('');
      showToast('保存成功');
      const latest = await sendMessage('getSettings', undefined);
      setHasApiKey(latest.hasApiKey);
    } else {
      showToast(res.message ?? '保存失败');
    }
  };

  const handleClear = async () => {
    const res = await sendMessage('saveSettings', { siliconflowApiKey: '' });
    if (res.ok) {
      setHasApiKey(false);
      setApiKey('');
      showToast('已清除 API Key');
    }
  };

  return (
    <div className="p-5 text-gray-900">
      <h1 className="text-lg font-semibold">Translator 设置</h1>
      <p className="mt-1 text-sm text-gray-500">硅基流动 API 配置</p>

      <div className="mt-5 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">API Key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasApiKey ? '已配置（输入新 Key 可覆盖）' : 'sk-...'}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">模型</span>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            保存
          </button>
          {hasApiKey && (
            <button
              type="button"
              onClick={() => void handleClear()}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              清除
            </button>
          )}
        </div>

        {hasApiKey && (
          <p className="text-xs text-green-600">✓ API Key 已配置</p>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow">
          {toast}
        </div>
      )}
    </div>
  );
}
