import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'AI Double',
    description: 'Sync prompts across AI chat sites',
    version: '0.1.0',
    permissions: ['storage', 'tabs'],
  },
});
