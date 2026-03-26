import type { SiteAdapter } from '@/adapters/types';
import type { SyncSendMessage } from '@/utils/messaging';

export function setupContentScript(adapter: SiteAdapter): void {
  // Wait for page to fully load before checking login
  const init = () => {
    if (!adapter.isLoggedIn()) {
      injectLoginBanner(adapter.name);
      // Retry on DOM changes (user may log in via SPA navigation)
      const observer = new MutationObserver(() => {
        if (adapter.isLoggedIn()) {
          observer.disconnect();
          removeLoginBanner();
          register();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return;
    }

    register();
  };

  function register() {
    // Register this tab — content scripts don't know their own tabId,
    // so background extracts it from sender.tab.id
    chrome.runtime.sendMessage({ type: 'REGISTER_SELF', site: adapter.name });

    // Listen for user send actions → broadcast to other tabs
    adapter.onSend((content: string) => {
      chrome.runtime.sendMessage({
        type: 'SYNC_SEND',
        content,
        fromTab: -1, // Background will fill in the correct tabId from sender
      } satisfies SyncSendMessage);
    });

    // Listen for incoming synced messages
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'SYNC_SEND') {
        adapter.setInputContent(message.content);
        adapter.triggerSend();
      }
    });

    // Inject floating toggle
    injectToggle(adapter);
  }

  // Check if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Delay slightly to let SPA frameworks render
    setTimeout(init, 1000);
  }
}

function injectToggle(adapter: SiteAdapter): void {
  const container = document.createElement('div');
  container.id = 'ai-double-toggle';
  document.body.appendChild(container);

  // Initial render
  updateToggle(adapter, container);

  // Update on storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.syncEnabled) {
      updateToggle(adapter, container);
    }
  });

  // Toggle on click
  container.addEventListener('click', () => {
    chrome.storage.local.get({ syncEnabled: true }, (result) => {
      const newState = !result.syncEnabled;
      chrome.runtime.sendMessage({ type: 'TOGGLE_SYNC', enabled: newState });
    });
  });
}

function updateToggle(adapter: SiteAdapter, container: HTMLElement): void {
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (response) {
      adapter.renderToggle(container, {
        enabled: response.syncEnabled,
        connectedCount: response.registeredTabs.length,
      });
    }
  });
}

function injectLoginBanner(siteName: string): void {
  const banner = document.createElement('div');
  banner.id = 'ai-double-login-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 99999;
    background: #FEF3C7;
    color: #92400E;
    padding: 8px 16px;
    text-align: center;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    border-bottom: 1px solid #F59E0B;
  `;
  banner.textContent = `AI Double: Please log in to ${siteName} to enable sync`;
  document.body.prepend(banner);
}

function removeLoginBanner(): void {
  document.getElementById('ai-double-login-banner')?.remove();
}
