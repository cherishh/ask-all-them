import type { SiteAdapter } from './types';
import { SUPPORTED_SITES as SITE_LIST } from './sites';
import { ClaudeAdapter } from './claude';
import { ChatGPTAdapter } from './chatgpt';
import { GeminiAdapter } from './gemini';

export interface AdapterEntry {
  name: string;
  url: string;
  factory: () => SiteAdapter;
}

export const ADAPTER_ENTRIES: AdapterEntry[] = [
  { ...SITE_LIST[0], factory: () => new ClaudeAdapter() },
  { ...SITE_LIST[1], factory: () => new ChatGPTAdapter() },
  { ...SITE_LIST[2], factory: () => new GeminiAdapter() },
];

export function createAdapterForCurrentSite(): SiteAdapter | null {
  const hostname = window.location.hostname;

  for (const entry of ADAPTER_ENTRIES) {
    const entryHost = new URL(entry.url).hostname;
    if (hostname === entryHost || hostname.endsWith('.' + entryHost)) {
      return entry.factory();
    }
  }

  return null;
}
