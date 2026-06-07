export interface UserSettings {
  siliconflowApiKey: string;
  model: string;
}

export const DEFAULT_MODEL = 'Qwen/Qwen2.5-7B-Instruct';

export const DEFAULT_SETTINGS: UserSettings = {
  siliconflowApiKey: '',
  model: DEFAULT_MODEL,
};

export interface SaveSettingsRequest {
  siliconflowApiKey?: string;
  model?: string;
}

export interface SettingsResponse {
  hasApiKey: boolean;
  model: string;
}

export interface SaveSettingsResponse {
  ok: boolean;
  message?: string;
}
