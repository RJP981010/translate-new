import { DEFAULT_SETTINGS, type UserSettings } from '../types/settings';

const STORAGE_KEY = 'userSettings';

export async function getUserSettings(): Promise<UserSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as Partial<UserSettings> | undefined;
  return {
    siliconflowApiKey: stored?.siliconflowApiKey ?? DEFAULT_SETTINGS.siliconflowApiKey,
    model: stored?.model?.trim() || DEFAULT_SETTINGS.model,
  };
}

export async function saveUserSettings(
  partial: Partial<UserSettings>,
): Promise<UserSettings> {
  const current = await getUserSettings();
  const next: UserSettings = {
    siliconflowApiKey:
      partial.siliconflowApiKey !== undefined
        ? partial.siliconflowApiKey.trim()
        : current.siliconflowApiKey,
    model: partial.model?.trim() || current.model,
  };
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}
