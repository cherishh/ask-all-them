import type { SiteAdapter } from './types';
import { ClaudeAdapter } from './claude';
import { ChatGPTAdapter } from './chatgpt';
import { GeminiAdapter } from './gemini';

interface AdapterEntry {
  name: string;
  url: string;
  factory: () => SiteAdapter;
}

export const SUPPORTED_SITES: AdapterEntry[] = [
  { name: 'claude', url: 'https://claude.ai', factory: () => new ClaudeAdapter() },
  { name: 'chatgpt', url: 'https://chatgpt.com', factory: () => new ChatGPTAdapter() },
  { name: 'gemini', url: 'https://gemini.google.com', factory: () => new GeminiAdapter() },
];

export function createAdapterForCurrentSite(): SiteAdapter | null {
  const hostname = window.location.hostname;

  for (const entry of SUPPORTED_SITES) {
    const entryHost = new URL(entry.url).hostname;
    if (hostname === entryHost || hostname.endsWith('.' + entryHost)) {
      return entry.factory();
    }
  }

  return null;
}
