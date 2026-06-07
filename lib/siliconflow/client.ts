import OpenAI from 'openai';

const BASE_URL = 'https://api.siliconflow.cn/v1';

export function createSiliconFlowClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: BASE_URL,
    dangerouslyAllowBrowser: false,
  });
}
