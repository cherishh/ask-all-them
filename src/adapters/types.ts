export interface SyncState {
  enabled: boolean;
  connectedCount: number;
}

export interface SiteAdapter {
  /** Unique site identifier */
  name: string;

  /** URL match patterns for manifest */
  matchPatterns: string[];

  /** Read current input box content */
  getInputContent(): string;

  /** Write content into the input box */
  setInputContent(content: string): void;

  /** Programmatically trigger the send action */
  triggerSend(): void;

  /** Check if user is logged in on this site */
  isLoggedIn(): boolean;

  /** Listen for user send actions, call callback with input content */
  onSend(callback: (content: string) => void): void;

  /** Render the sync toggle UI into a container element */
  renderToggle(container: HTMLElement, state: SyncState): void;

  /** Clean up all listeners and injected UI */
  destroy(): void;
}
