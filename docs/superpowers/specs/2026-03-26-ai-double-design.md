# AI Double - Design Spec

Chrome extension that synchronizes user prompts across multiple AI chat websites.

## Problem

Users often want to send the same prompt to multiple AI providers (Claude, ChatGPT, Gemini) to compare responses. Doing this manually requires switching tabs, copy-pasting, and is tedious.

## Solution

A Chrome extension that:
1. Auto-opens paired AI sites in new tabs when the user opens one
2. Captures the user's send action on any AI site and broadcasts the input to all other registered tabs
3. Provides a simple toggle to enable/disable sync

## Tech Stack

- **Framework:** WXT (Vite-based Chrome extension framework)
- **UI:** React + Tailwind CSS
- **Package manager:** pnpm
- **Language:** TypeScript
- **Target:** Chrome Extension Manifest V3

## Architecture

### Overview

```
Content Script (Tab A)  ──SYNC_SEND──→  Background SW  ──broadcast──→  Content Script (Tab B)
                                                        ──broadcast──→  Content Script (Tab C)
                                                        ──broadcast──→  ...up to 6 tabs
```

Every tab is both a sender and a receiver. Background Service Worker acts as a message router.

### Components

#### 1. Background Service Worker

Responsibilities:
- Maintain a registry of active tabs: `Map<number, string>` (tabId → site name)
- Route `SYNC_SEND` messages to all registered tabs except the sender
- Clean up on `chrome.tabs.onRemoved`
- Store sync toggle state in `chrome.storage.local`

#### 2. Site Adapters

Unified interface for each AI site:

```typescript
interface SiteAdapter {
  name: string;
  matchPatterns: string[];

  getInputContent(): string;
  setInputContent(content: string): void;
  triggerSend(): void;
  isLoggedIn(): boolean;

  onSend(callback: (content: string) => void): void;
  destroy(): void;

  // Each adapter provides its own UI component for the in-page sync toggle
  renderToggle(container: HTMLElement, state: SyncState): void;
}
```

Initial adapters:
- `claude.ts` — claude.ai
- `chatgpt.ts` — chatgpt.com
- `gemini.ts` — gemini.google.com

Each adapter encapsulates site-specific DOM selectors and event simulation. The adapter interface is designed to be pluggable — adding a new site means adding one file.

#### 3. Content Script

Loaded on all matched AI sites. On load:
1. Detect which site via URL, instantiate the corresponding adapter
2. Check `adapter.isLoggedIn()`
   - If not logged in: inject a top banner prompting the user to log in; do NOT register with Background SW
   - If logged in: send `REGISTER_TAB` to Background SW
3. Set up `adapter.onSend()` listener — on user send, forward content to Background SW
4. Listen for incoming `SYNC_SEND` messages — call `adapter.setInputContent()` + `adapter.triggerSend()`
5. Inject the floating toggle component into the page

#### 4. Popup UI (React + Tailwind)

- Site list with "Open" buttons for each supported site
- "Open All" quick action
- Display which tabs are currently registered (online/offline/not-logged-in status)
- Global sync toggle

#### 5. Floating Toggle (injected in-page)

- Each adapter registers its own toggle UI via `renderToggle()`, allowing fully custom per-site rendering
- UI should blend into the host site's design language (colors, typography, spacing)
- Demo phase: use a shared default component, but architecture supports per-site custom components from day one

### Message Types

```typescript
type Message =
  | { type: 'SYNC_SEND'; content: string; fromTab: number }
  | { type: 'REGISTER_TAB'; site: string; tabId: number }
  | { type: 'UNREGISTER_TAB'; tabId: number }
  | { type: 'TOGGLE_SYNC'; enabled: boolean }
```

### Data Flow

1. User types a prompt in Claude and hits Send
2. Claude adapter's `onSend` fires, captures input content
3. Content Script sends `{ type: 'SYNC_SEND', content, fromTab }` to Background SW
4. Background SW checks sync toggle is enabled
5. Background SW iterates registered tabs, skips `fromTab`, sends message to each
6. Each receiving Content Script calls `adapter.setInputContent(content)` then `adapter.triggerSend()`

### Login Detection

Each adapter implements `isLoggedIn()` by checking site-specific DOM features:
- Presence of the input/compose area (logged-in users see it)
- Absence of login page elements (login form, sign-in buttons)

When not logged in:
- A prominent banner is injected at the top of the page
- The tab is NOT registered for sync
- On page reload after login, Content Script re-runs and re-checks

### Storage

`chrome.storage.local`:
- `syncEnabled: boolean` — global sync toggle
- `registeredSites: string[]` — which sites the user wants auto-opened (for Popup config)

### Constraints

- Max 6 simultaneous tabs in the sync group
- Sync is text-only (no file attachments or images in initial version)
- Adapters are fragile by nature — AI sites update their DOM frequently; adapters need maintenance

## Project Structure

```
ai-double/
├── src/
│   ├── entrypoints/
│   │   ├── background/index.ts        # Service Worker
│   │   ├── popup/                     # Popup UI (React)
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.html
│   │   └── content/index.ts           # Content Script entry
│   ├── adapters/
│   │   ├── types.ts                   # SiteAdapter interface
│   │   ├── claude.ts
│   │   ├── chatgpt.ts
│   │   └── gemini.ts
│   ├── components/
│   │   └── FloatingToggle.tsx         # In-page toggle component
│   └── utils/
│       └── messaging.ts               # Message type definitions
├── public/
│   └── icon.png
├── wxt.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Future Considerations (not in scope for demo)

- Per-site custom toggle UI that embeds natively into each site's layout
- User-configurable site pairs/groups
- File/image attachment sync
- Response comparison view
- Support for more AI providers
