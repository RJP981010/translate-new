import { defineExtensionMessaging } from '@webext-core/messaging';
import type { SaveSettingsRequest, SaveSettingsResponse, SettingsResponse } from '../types/settings';

interface ProtocolMap {
  getSettings(): SettingsResponse;
  saveSettings(req: SaveSettingsRequest): SaveSettingsResponse;
  openSettings(): void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();

export const LOOKUP_STREAM_PORT = 'lookupStream';
