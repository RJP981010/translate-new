import type { LookupMode } from '../../types/lookup';
import { isMostlyChinese } from '../selection';

export function buildSystemPrompt(mode: LookupMode, isChinese: boolean): string {
  if (mode === 'translation') {
    if (isChinese) {
      return '你是中文语言助手。用户选中中文句子，请用简洁中文解释句意、语义与用法。直接输出解释正文，不要 JSON，不要多余开场白。';
    }
    return '你是专业翻译。将用户给出的外文句子译为自然流畅的简体中文。只输出译文，不要 JSON，不要解释。';
  }

  if (isChinese) {
    return `你是中文词典助手。针对用户给出的中文词语，返回 ONLY 合法 JSON，不要 markdown 代码块：
{"word":"原词","phonetic":"拼音可选","primaryMeaning":"主要释义","definitions":[{"pos":"词性如 n.","meanings":["释义"],"example":{"en":"可选英文例","zh":"中文例句"}}]}`;
  }

  return `你是英文词典助手。针对用户给出的英文单词或短语，只输出一个合法 JSON 对象，禁止 markdown、禁止重复输出、禁止 relatedWords 等额外字段：
{"word":"原词","phonetic":"IPA音标","primaryMeaning":"中文主要释义","definitions":[{"pos":"词性如 n.","meanings":["释义1","释义2"],"example":{"en":"英文例句","zh":"中文翻译"}}]}`;
}

export function buildUserMessage(text: string, mode: LookupMode, isChinese: boolean): string {
  if (mode === 'translation') {
    return isChinese ? `请解释以下中文：\n${text}` : `请翻译：\n${text}`;
  }
  return `请查词：${text}`;
}

export function resolveIsChinese(text: string): boolean {
  return isMostlyChinese(text);
}
