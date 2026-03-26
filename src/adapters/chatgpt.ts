import type { SiteAdapter, SyncState } from './types';

export class ChatGPTAdapter implements SiteAdapter {
  name = 'chatgpt';
  matchPatterns = ['*://chatgpt.com/*'];

  private sendCallback: ((content: string) => void) | null = null;
  private cleanup: (() => void)[] = [];

  getInputContent(): string {
    const editor = document.querySelector<HTMLDivElement>('#prompt-textarea');
    return editor?.textContent?.trim() ?? '';
  }

  setInputContent(content: string): void {
    const editor = document.querySelector<HTMLDivElement>('#prompt-textarea');
    if (!editor) return;
    editor.focus();
    editor.textContent = content;
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }

  triggerSend(): void {
    setTimeout(() => {
      const sendButton = document.querySelector<HTMLButtonElement>('button[data-testid="send-button"]');
      if (sendButton && !sendButton.disabled) sendButton.click();
    }, 100);
  }

  isLoggedIn(): boolean {
    return document.querySelector('#prompt-textarea') !== null;
  }

  onSend(callback: (content: string) => void): void {
    this.sendCallback = callback;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        const content = this.getInputContent();
        if (content && this.sendCallback) setTimeout(() => this.sendCallback?.(content), 0);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button[data-testid="send-button"]')) {
        const content = this.getInputContent();
        if (content && this.sendCallback) setTimeout(() => this.sendCallback?.(content), 0);
      }
    };

    document.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('click', handleClick, true);
    this.cleanup.push(() => {
      document.removeEventListener('keydown', handleKeydown, true);
      document.removeEventListener('click', handleClick, true);
    });
  }

  renderToggle(container: HTMLElement, state: SyncState): void {
    container.innerHTML = `
      <div style="
        position: fixed; bottom: 16px; right: 16px; z-index: 10000;
        background: ${state.enabled ? '#10A37F' : '#6B7280'};
        color: white; border-radius: 9999px; padding: 6px 12px;
        font-size: 12px; cursor: pointer; opacity: 0.6;
        transition: opacity 0.2s; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      " onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.6'">
        ${state.enabled ? `🔗 ${state.connectedCount}` : '⏸'}
      </div>
    `;
  }

  destroy(): void {
    this.cleanup.forEach((fn) => fn());
    this.cleanup = [];
    this.sendCallback = null;
  }
}
