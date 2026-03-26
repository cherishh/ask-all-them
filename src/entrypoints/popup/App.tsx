import { useState, useEffect } from 'react';
import { SUPPORTED_SITES } from '@/adapters/registry';
import type { StatusResponseMessage } from '@/utils/messaging';

interface TabStatus {
  tabId: number;
  site: string;
}

export default function App() {
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [registeredTabs, setRegisteredTabs] = useState<TabStatus[]>([]);

  const refreshStatus = () => {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response: StatusResponseMessage) => {
      if (response) {
        setSyncEnabled(response.syncEnabled);
        setRegisteredTabs(response.registeredTabs);
      }
    });
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleSync = () => {
    const newState = !syncEnabled;
    chrome.runtime.sendMessage({ type: 'TOGGLE_SYNC', enabled: newState });
    setSyncEnabled(newState);
  };

  const openSite = (url: string) => {
    chrome.tabs.create({ url });
  };

  const openAll = () => {
    SUPPORTED_SITES.forEach((site) => {
      const isOpen = registeredTabs.some((tab) => tab.site === site.name);
      if (!isOpen) {
        chrome.tabs.create({ url: site.url });
      }
    });
  };

  return (
    <div className="w-72 p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-900">AI Double</h1>
        <button
          onClick={toggleSync}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            syncEnabled ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              syncEnabled ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {SUPPORTED_SITES.map((site) => {
          const activeTabs = registeredTabs.filter((t) => t.site === site.name);
          const isOnline = activeTabs.length > 0;

          return (
            <div
              key={site.name}
              className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="text-sm text-gray-700 capitalize">{site.name}</span>
              </div>
              {!isOnline && (
                <button
                  onClick={() => openSite(site.url)}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  Open
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={openAll}
        className="w-full py-1.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors"
      >
        Open All
      </button>

      <p className="mt-3 text-xs text-gray-400 text-center">
        {registeredTabs.length} site{registeredTabs.length !== 1 ? 's' : ''} connected
      </p>
    </div>
  );
}
