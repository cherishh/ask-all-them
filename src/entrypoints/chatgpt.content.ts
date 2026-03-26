import { ChatGPTAdapter } from '@/adapters/chatgpt';
import { setupContentScript } from '@/utils/content-setup';

export default defineContentScript({
  matches: ['*://chatgpt.com/*'],
  runAt: 'document_idle',
  main() {
    setupContentScript(new ChatGPTAdapter());
  },
});
