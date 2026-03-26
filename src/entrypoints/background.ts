import { type Message } from '@/utils/messaging';

export default defineBackground(() => {
  const registry = new Map<number, string>();

  chrome.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
      const tabId = sender.tab?.id;

      switch (message.type) {
        case 'REGISTER_TAB': {
          if (registry.size >= 6) {
            console.warn('[AI Double] Max 6 tabs reached, ignoring registration');
            return;
          }
          registry.set(message.tabId, message.site);
          console.log(`[AI Double] Registered tab ${message.tabId} for ${message.site}`);
          break;
        }

        case 'REGISTER_SELF': {
          if (!tabId) return;
          if (registry.size >= 6) {
            console.warn('[AI Double] Max 6 tabs reached');
            return;
          }
          registry.set(tabId, message.site);
          console.log(`[AI Double] Registered tab ${tabId} for ${message.site}`);
          break;
        }

        case 'UNREGISTER_TAB': {
          registry.delete(message.tabId);
          console.log(`[AI Double] Unregistered tab ${message.tabId}`);
          break;
        }

        case 'SYNC_SEND': {
          chrome.storage.local.get({ syncEnabled: true }, (result) => {
            if (!result.syncEnabled) return;

            for (const [registeredTabId] of registry) {
              if (registeredTabId === (tabId ?? message.fromTab)) continue;
              chrome.tabs.sendMessage(registeredTabId, {
                type: 'SYNC_SEND',
                content: message.content,
                fromTab: message.fromTab,
              }).catch((err) => {
                console.warn(`[AI Double] Failed to send to tab ${registeredTabId}:`, err);
                registry.delete(registeredTabId);
              });
            }
          });
          break;
        }

        case 'TOGGLE_SYNC': {
          chrome.storage.local.set({ syncEnabled: message.enabled });
          break;
        }

        case 'GET_STATUS': {
          chrome.storage.local.get({ syncEnabled: true }, (result) => {
            sendResponse({
              type: 'STATUS_RESPONSE',
              syncEnabled: result.syncEnabled,
              registeredTabs: Array.from(registry.entries()).map(
                ([tabId, site]) => ({ tabId, site })
              ),
            } satisfies Message);
          });
          return true; // keep channel open for async sendResponse
        }
      }
    }
  );

  // Clean up when tabs are closed
  chrome.tabs.onRemoved.addListener((tabId) => {
    if (registry.has(tabId)) {
      registry.delete(tabId);
      console.log(`[AI Double] Tab ${tabId} closed, removed from registry`);
    }
  });

  // Initialize storage defaults
  chrome.storage.local.get({ syncEnabled: true }, (result) => {
    chrome.storage.local.set({ syncEnabled: result.syncEnabled });
  });
});
