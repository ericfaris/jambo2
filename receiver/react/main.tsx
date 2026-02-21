// ============================================================================
// React Chromecast Receiver - Entry Point
// Renders TVScreen using the CAF receiver hook for game state.
// ============================================================================

import { StrictMode, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { TVScreen } from '../../src/ui/TVScreen.tsx';
import { useCastReceiver } from './useCastReceiver.ts';

type DebugLevel = 'log' | 'warn' | 'error';

interface DebugEntry {
  id: number;
  level: DebugLevel;
  time: string;
  text: string;
}

interface DebugStore {
  entries: DebugEntry[];
  listeners: Set<() => void>;
  nextId: number;
  installed: boolean;
  maxEntries: number;
  overlayVisible: boolean;
}

declare global {
  interface Window {
    __jamboReceiverDebugStore?: DebugStore;
  }
}

function getDebugStore(): DebugStore {
  if (!window.__jamboReceiverDebugStore) {
    window.__jamboReceiverDebugStore = {
      entries: [],
      listeners: new Set<() => void>(),
      nextId: 1,
      installed: false,
      maxEntries: 5000,
      overlayVisible: false,
    };
  }
  return window.__jamboReceiverDebugStore;
}

function notifyDebugListeners(): void {
  const store = getDebugStore();
  for (const listener of store.listeners) {
    listener();
  }
}

function addDebugEntry(level: DebugLevel, args: unknown[]): void {
  const store = getDebugStore();
  const text = args.map((arg) => {
    if (typeof arg === 'string') return arg;
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }).join(' ');

  const entry: DebugEntry = {
    id: store.nextId++,
    level,
    time: new Date().toLocaleTimeString(),
    text,
  };

  store.entries.push(entry);
  if (store.entries.length > store.maxEntries) {
    store.entries.splice(0, store.entries.length - store.maxEntries);
  }

  notifyDebugListeners();
}

function clearDebugEntries(): void {
  const store = getDebugStore();
  store.entries = [];
  notifyDebugListeners();
}

function setDebugOverlayVisible(visible: boolean): void {
  const store = getDebugStore();
  store.overlayVisible = visible;
  notifyDebugListeners();
}

function getDebugOverlayVisible(): boolean {
  return getDebugStore().overlayVisible;
}

function installDebugCapture(): void {
  const store = getDebugStore();
  if (store.installed) return;
  store.installed = true;

  const originalLog = console.log.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  console.log = (...args: unknown[]) => {
    originalLog(...args);
    addDebugEntry('log', args);
  };
  console.warn = (...args: unknown[]) => {
    originalWarn(...args);
    addDebugEntry('warn', args);
  };
  console.error = (...args: unknown[]) => {
    originalError(...args);
    addDebugEntry('error', args);
  };

  window.addEventListener('error', (event) => {
    addDebugEntry('error', [`[window.error] ${event.message}`]);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = (event.reason instanceof Error)
      ? `${event.reason.name}: ${event.reason.message}`
      : String(event.reason);
    addDebugEntry('error', [`[unhandledrejection] ${reason}`]);
  });

  addDebugEntry('log', ['[ReceiverDebug] TV debug overlay capture active']);
}

function useDebugEntries(): DebugEntry[] {
  const store = useMemo(() => getDebugStore(), []);
  const [entries, setEntries] = useState<DebugEntry[]>(() => [...store.entries]);

  useEffect(() => {
    const onChange = () => {
      setEntries([...store.entries]);
    };
    store.listeners.add(onChange);
    return () => {
      store.listeners.delete(onChange);
    };
  }, [store]);

  return entries;
}

const debugButtonStyle: CSSProperties = {
  marginLeft: 4,
  background: '#2a1a08',
  color: '#f5ca6c',
  border: '1px solid #f5ca6c',
  borderRadius: 6,
  padding: '2px 8px',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 11,
};

function DebugOverlay() {
  const entries = useDebugEntries();
  const store = useMemo(() => getDebugStore(), []);
  const [visible, setVisible] = useState<boolean>(() => store.overlayVisible);
  const [expanded, setExpanded] = useState(true);
  const displayedEntries = [...entries].reverse();

  useEffect(() => {
    const onChange = () => {
      setVisible(store.overlayVisible);
    };
    store.listeners.add(onChange);
    return () => {
      store.listeners.delete(onChange);
    };
  }, [store]);

  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        left: 8,
        width: expanded ? 'min(1200px, 98vw)' : 'auto',
        height: expanded ? '80vh' : 'auto',
        overflow: 'hidden',
        zIndex: 99999,
        border: '2px solid #d4a850',
        borderRadius: 10,
        background: 'rgba(0,0,0,0.90)',
        color: '#f4eee4',
        fontFamily: 'monospace',
        fontSize: 12,
        boxShadow: '0 10px 24px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderBottom: expanded ? '1px solid rgba(212,168,80,0.4)' : 'none',
        }}
      >
        <strong style={{ color: '#f5ca6c' }}>TV Debug Logs</strong>
        <span style={{ color: '#d0bfaa' }}>{entries.length} entries</span>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          style={debugButtonStyle}
        >
          {expanded ? 'Hide' : 'Show'}
        </button>
        <button
          type="button"
          onClick={() => {
            clearDebugEntries();
            addDebugEntry('log', ['[ReceiverDebug] Logs cleared']);
          }}
          style={debugButtonStyle}
        >
          Clear
        </button>
      </div>
      {expanded && (
        <div style={{ overflowY: 'scroll', height: 'calc(80vh - 44px)', padding: '4px 10px 10px' }}>
          {entries.length === 0 && (
            <div style={{ color: '#d0bfaa' }}>No logs yet.</div>
          )}
          {displayedEntries.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: '2px 0',
                color: entry.level === 'error' ? '#ff9f7a' : entry.level === 'warn' ? '#ffd39b' : '#f4eee4',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              [{entry.time}] {entry.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReceiverBody() {
  const ws = useCastReceiver();

  if (!ws.publicState) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'var(--font-heading)',
          color: 'var(--text)',
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 32,
            maxWidth: 500,
            textAlign: 'center',
          }}
        >
          <h1 style={{ color: 'var(--gold)', margin: '0 0 12px', fontSize: 36 }}>Jambo TV</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, margin: 0 }}>
            Waiting for cast room sync...
          </p>
        </div>
      </div>
    );
  }

  return <TVScreen ws={ws} />;
}

function ReceiverApp() {
  useEffect(() => {
    installDebugCapture();

    const onDebugToggle = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: boolean }>).detail;
      const nextVisible = typeof detail?.enabled === 'boolean'
        ? detail.enabled
        : !getDebugOverlayVisible();
      setDebugOverlayVisible(nextVisible);
      addDebugEntry('log', [`[ReceiverDebug] TV debug overlay ${nextVisible ? 'enabled' : 'hidden'} by sender`]);
    };

    window.addEventListener('jambo:receiver-debug-overlay-toggle', onDebugToggle as EventListener);
    return () => {
      window.removeEventListener('jambo:receiver-debug-overlay-toggle', onDebugToggle as EventListener);
    };
  }, []);

  return (
    <>
      <ReceiverBody />
      <DebugOverlay />
    </>
  );
}

installDebugCapture();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReceiverApp />
  </StrictMode>,
);
