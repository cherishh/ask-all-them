import { GeminiAdapter } from '@/adapters/gemini';
import { setupContentScript } from '@/utils/content-setup';

export default defineContentScript({
  matches: ['*://gemini.google.com/*'],
  runAt: 'document_idle',
  main() {
    setupContentScript(new GeminiAdapter());
  },
});
