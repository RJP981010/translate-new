import { onMessage } from '../lib/messaging';
import { validateSelection } from '../lib/selection';
import { createSiliconFlowClient } from '../lib/siliconflow/client';
import { buildFallbackResult, parseLookupResult } from '../lib/siliconflow/parser';
import { streamLookup } from '../lib/siliconflow/stream';
import { getUserSettings, saveUserSettings } from '../lib/storage';
import { LOOKUP_STREAM_PORT } from '../lib/messaging';
import type {
  LookupStreamCancel,
  LookupStreamStart,
} from '../types/lookup';

export default defineBackground(() => {
  onMessage('getSettings', async () => {
    const settings = await getUserSettings();
    return {
      hasApiKey: settings.siliconflowApiKey.length > 0,
      model: settings.model,
    };
  });

  onMessage('saveSettings', async (message) => {
    try {
      await saveUserSettings(message.data);
      return { ok: true };
    } catch {
      return { ok: false, message: '保存失败' };
    }
  });

  onMessage('openSettings', async () => {
    await chrome.tabs.create({ url: chrome.runtime.getURL('/popup.html') });
  });

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== LOOKUP_STREAM_PORT) return;

    let cancelled = false;
    let activeRequestId: string | null = null;

    port.onMessage.addListener((msg: LookupStreamStart | LookupStreamCancel) => {
      if (msg.type === 'cancel') {
        if (msg.requestId === activeRequestId) cancelled = true;
        return;
      }

      if (msg.type !== 'start') return;

      cancelled = false;
      activeRequestId = msg.requestId;
      void handleLookupStream(port, msg, () => cancelled);
    });
  });
});

async function handleLookupStream(
  port: chrome.runtime.Port,
  msg: LookupStreamStart,
  isCancelled: () => boolean,
) {
  const { requestId, text, mode } = msg;

  const validation = validateSelection(text);
  if (!validation.ok) {
    port.postMessage({
      type: 'error',
      requestId,
      code: 'INVALID_SELECTION',
      message:
        validation.reason === 'too_long'
          ? '选区过长，请缩小范围（≤500 字）'
          : '无可查词内容',
    });
    return;
  }

  const settings = await getUserSettings();
  if (!settings.siliconflowApiKey) {
    port.postMessage({
      type: 'error',
      requestId,
      code: 'CONFIG_MISSING',
      message: '请先配置 API Key',
    });
    return;
  }

  const client = createSiliconFlowClient(settings.siliconflowApiKey);

  await streamLookup(client, settings.model, validation.text, mode, {
    isCancelled,
    onChunk: (delta) => {
      if (isCancelled()) return;
      port.postMessage({ type: 'chunk', requestId, delta });
    },
    onDone: (fullText) => {
      if (isCancelled()) return;
      if (mode === 'dictionary') {
        const parsed = parseLookupResult(fullText, validation.text, 'background');
        const data = parsed ?? buildFallbackResult(validation.text, fullText);
        port.postMessage({ type: 'done', requestId, data });
      } else {
        port.postMessage({ type: 'done', requestId });
      }
    },
    onError: (message) => {
      if (isCancelled()) return;
      port.postMessage({
        type: 'error',
        requestId,
        code: 'API_ERROR',
        message: message.includes('401') ? 'API Key 无效' : `请求失败：${message}`,
      });
    },
  });
}
