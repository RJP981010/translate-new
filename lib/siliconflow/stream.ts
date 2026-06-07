import type OpenAI from 'openai';
import type { LookupMode } from '../../types/lookup';
import {
  buildSystemPrompt,
  buildUserMessage,
  resolveIsChinese,
} from './prompt';

export interface StreamHandlers {
  onChunk: (delta: string) => void;
  onDone: (fullText: string) => void;
  onError: (message: string) => void;
  isCancelled: () => boolean;
}

export async function streamLookup(
  client: OpenAI,
  model: string,
  text: string,
  mode: LookupMode,
  handlers: StreamHandlers,
): Promise<void> {
  const isChinese = resolveIsChinese(text);
  const system = buildSystemPrompt(mode, isChinese);
  const user = buildUserMessage(text, mode, isChinese);

  try {
    const stream = await client.chat.completions.create({
      model,
      stream: true,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      ...(mode === 'dictionary' ? { response_format: { type: 'json_object' as const } } : {}),
    });

    let full = '';
    for await (const chunk of stream) {
      if (handlers.isCancelled()) return;
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        full += delta;
        handlers.onChunk(delta);
      }
    }

    if (!handlers.isCancelled()) {
      handlers.onDone(full);
    }
  } catch (err) {
    if (handlers.isCancelled()) return;
    const message = err instanceof Error ? err.message : 'API 请求失败';
    handlers.onError(message);
  }
}
