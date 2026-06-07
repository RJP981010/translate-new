import { describe, expect, it } from 'vitest';
import { parseLookupResult } from '../../lib/siliconflow/parser';

describe('parser', () => {
  it('parses valid JSON', () => {
    const raw = JSON.stringify({
      word: 'welcome',
      phonetic: '/ˈwelkəm/',
      primaryMeaning: '欢迎',
      definitions: [
        {
          pos: 'v.',
          meanings: ['欢迎'],
          example: { en: 'We welcome you.', zh: '我们欢迎你。' },
        },
      ],
    });
    const result = parseLookupResult(raw);
    expect(result?.word).toBe('welcome');
    expect(result?.primaryMeaning).toBe('欢迎');
  });

  it('extracts JSON from surrounding text', () => {
    const raw = `Here is result: {"word":"test","primaryMeaning":"测试","definitions":[{"pos":"n.","meanings":["测试"]}]}`;
    const result = parseLookupResult(raw);
    expect(result?.word).toBe('test');
  });

  it('returns null for invalid JSON', () => {
    expect(parseLookupResult('not json')).toBeNull();
  });

  it.each([
    ['meanings as string', '{"word":"framework","definitions":[{"pos":"n.","meanings":"架构；结构"}]}'],
    ['meaning singular', '{"word":"framework","definitions":[{"pos":"n.","meaning":"架构"}]}'],
    [
      'markdown fence',
      '```json\n{"word":"framework","definitions":[{"pos":"n.","meanings":["架构"]}]}\n```',
    ],
    ['no word field', '{"phonetic":"/x/","definitions":[{"pos":"n.","meanings":["架构"]}]}'],
    [
      'definition object',
      '{"word":"framework","definition":{"pos":"n.","meanings":["架构"]}}',
    ],
    [
      'top-level meaning',
      '{"word":"framework","meaning":"架构","definitions":[{"pos":"n.","meanings":["架构"]}]}',
    ],
  ])('handles %s', (_label, raw) => {
    const result = parseLookupResult(raw, 'framework');
    expect(result).not.toBeNull();
    expect(result?.primaryMeaning).toBeTruthy();
  });

  it('salvages corrupted duplicate JSON from model', () => {
    const raw =
      '{"word":"assistants","phonetic":"əˈsɪstənts","primaryMeaning":"助手；助理人员；辅助物","definitions":[{"pos":"n.","meanings":["n.帮助者；助理人员；辅助工具"]},{"example":"The team has several assistants to complete the project."},{"relatedWords":"assist","assistance」「assistantship」「co-assistant」}]}``````json {"  :"assistants"';
    const result = parseLookupResult(raw, 'assistants');
    expect(result).not.toBeNull();
    expect(result?.word).toBe('assistants');
    expect(result?.primaryMeaning).toBe('助手；助理人员；辅助物');
    expect(result?.definitions[0].meanings[0]).toContain('帮助者');
    expect(result?.definitions[0].example?.en).toContain('assistants');
  });

  it('derives primaryMeaning from first definition when missing', () => {
    const raw = JSON.stringify({
      word: 'framework',
      phonetic: "'freɪmwɜːrk",
      definitions: [
        {
          pos: 'n.',
          meanings: ['架构；结构；体系；纲要'],
          example: {
            en: 'The software provides a framework for data analysis.',
            zh: '该软件提供了一个数据分析框架。',
          },
        },
      ],
    });
    const result = parseLookupResult(raw);
    expect(result?.word).toBe('framework');
    expect(result?.primaryMeaning).toBe('架构；结构；体系；纲要');
    expect(result?.definitions[0].example?.en).toContain('framework');
  });
});
