import { ClaudeAdapter } from '@/adapters/claude';
import { setupContentScript } from '@/utils/content-setup';

export default defineContentScript({
  matches: ['*://claude.ai/*'],
  runAt: 'document_idle',
  main() {
    setupContentScript(new ClaudeAdapter());
  },
});
