// ============================================================================
// React Chromecast Receiver — Entry Point
// Renders TVScreen using the CAF receiver hook for game state.
// ============================================================================

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { TVScreen } from '../../src/ui/TVScreen.tsx';
import { useCastReceiver } from './useCastReceiver.ts';

function ReceiverApp() {
  const ws = useCastReceiver();

  if (!ws.publicState) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'var(--font-heading)',
        color: 'var(--text)',
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 32,
          maxWidth: 500,
          textAlign: 'center',
        }}>
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReceiverApp />
  </StrictMode>,
);
