# Ask All Them

A Chrome extension that synchronizes your prompts across multiple AI chat sites. Type once, send to all.

## What it does

- Open Claude, ChatGPT, and Gemini tabs from the extension popup
- Send a prompt on any one of them, and it automatically gets sent to all the others
- Toggle sync on/off anytime via the in-page floating button or the popup
- Detects if you're not logged in and shows a reminder banner

## Supported Sites

| Site | URL |
|------|-----|
| Claude | claude.ai |
| ChatGPT | chatgpt.com |
| Gemini | gemini.google.com |

Up to 6 tabs can be synced simultaneously.

## How it works

```
Tab A (Claude)  ──send──→  Background SW  ──broadcast──→  Tab B (ChatGPT)
                                          ──broadcast──→  Tab C (Gemini)
```

Each AI site tab runs a content script with a site-specific adapter. When you send a message on any tab, the content script captures the text and forwards it to the background service worker, which broadcasts it to all other registered tabs. Each receiving tab's adapter writes the text into the input box and triggers send.

## Tech Stack

- [WXT](https://wxt.dev) - Chrome extension framework (Vite-based)
- React + Tailwind CSS - Popup UI
- TypeScript - Everything
- Chrome Manifest V3

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (auto-reloads extension)
pnpm dev

# Build for production
pnpm build

# Type check
pnpm compile
```

### Load in Chrome

1. Run `pnpm dev`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" → select `.output/chrome-mv3`

## Project Structure

```
src/
├── entrypoints/
│   ├── background.ts              # Service worker: message routing + tab registry
│   ├── popup/                     # Extension popup (React)
│   ├── claude.content.ts          # Content script for claude.ai
│   ├── chatgpt.content.ts         # Content script for chatgpt.com
│   └── gemini.content.ts          # Content script for gemini.google.com
├── adapters/
│   ├── types.ts                   # SiteAdapter interface
│   ├── claude.ts                  # Claude DOM adapter
│   ├── chatgpt.ts                 # ChatGPT DOM adapter
│   ├── gemini.ts                  # Gemini DOM adapter
│   ├── registry.ts                # Adapter factory
│   └── sites.ts                   # Site metadata (name + URL)
└── utils/
    ├── messaging.ts               # Message type definitions
    └── content-setup.ts           # Shared content script logic
```

## Adding a new AI site

1. Create an adapter in `src/adapters/` implementing the `SiteAdapter` interface
2. Add the site to `src/adapters/sites.ts` and `src/adapters/registry.ts`
3. Create a content script in `src/entrypoints/<site>.content.ts`

## Known Limitations

- DOM selectors for AI sites change frequently; adapters may need updates when sites redesign
- Text-only sync (no file/image attachments)
- Sync is one-way per action (no real-time keystroke mirroring)

## License

MIT
