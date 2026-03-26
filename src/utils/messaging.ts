export interface SyncSendMessage {
  type: 'SYNC_SEND';
  content: string;
  fromTab: number;
}

export interface RegisterTabMessage {
  type: 'REGISTER_TAB';
  site: string;
  tabId: number;
}

export interface UnregisterTabMessage {
  type: 'UNREGISTER_TAB';
  tabId: number;
}

export interface ToggleSyncMessage {
  type: 'TOGGLE_SYNC';
  enabled: boolean;
}

export interface GetStatusMessage {
  type: 'GET_STATUS';
}

export interface StatusResponseMessage {
  type: 'STATUS_RESPONSE';
  syncEnabled: boolean;
  registeredTabs: Array<{ tabId: number; site: string }>;
}

export interface RegisterSelfMessage {
  type: 'REGISTER_SELF';
  site: string;
}

export type Message =
  | SyncSendMessage
  | RegisterTabMessage
  | UnregisterTabMessage
  | ToggleSyncMessage
  | GetStatusMessage
  | StatusResponseMessage
  | RegisterSelfMessage;
