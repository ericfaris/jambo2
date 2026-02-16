// ============================================================================
// Simple hash-based router for Cast Mode
// No hash → normal local game | /#/tv → TV screen | /#/play → Player screen
// ============================================================================

import { useState, useEffect } from 'react';
import { GameScreen } from './GameScreen.tsx';
import { CastLobby } from './CastLobby.tsx';
import { TVScreen } from './TVScreen.tsx';
import { PlayerScreen } from './PlayerScreen.tsx';
import { MainMenu } from './screens/MainMenu.tsx';
import { LoginModal } from './screens/LoginModal.tsx';
import { PreGameSetupModal } from './screens/PreGameSetupModal.tsx';
import { useWebSocketGame } from '../multiplayer/client.ts';
import type { AIDifficulty } from '../ai/difficulties/index.ts';
import { useGameStore } from '../hooks/useGameStore.ts';

type Route = 'local' | 'tv' | 'play';
type Screen = 'menu' | 'solo' | 'multiplayer' | 'login' | 'settings';

function getRoute(): Route {
  const hash = window.location.hash;
  if (hash === '#/tv' || hash === '#/tv/') return 'tv';
  if (hash === '#/play' || hash === '#/play/') return 'play';
  return 'local';
}

export function Router() {
  const [route, setRoute] = useState<Route>(getRoute);
  const [screen, setScreen] = useState<Screen>('menu');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [pendingMode, setPendingMode] = useState<'solo' | 'multiplayer' | null>(null);
  const [showPreGameSetup, setShowPreGameSetup] = useState(false);
  const newGame = useGameStore((store) => store.newGame);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleMenuSelect = (option: 'login' | 'solo' | 'multiplayer' | 'settings') => {
    if (option === 'solo' || option === 'multiplayer') {
      setPendingMode(option);
      setShowPreGameSetup(true);
      return;
    }
    setScreen(option);
  };

  const handleClosePreGameSetup = () => {
    setShowPreGameSetup(false);
    setPendingMode(null);
  };

  const handleStartFromPreGameSetup = ({
    castMode,
    firstPlayer,
  }: {
    castMode: boolean;
    firstPlayer: 0 | 1;
  }) => {
    if (!pendingMode) {
      return;
    }

    setShowPreGameSetup(false);

    if (castMode) {
      window.location.hash = '#/tv';
      setScreen('menu');
      setPendingMode(null);
      return;
    }

    if (pendingMode === 'solo') {
      newGame(undefined, firstPlayer);
      setScreen('solo');
      setPendingMode(null);
      return;
    }

    newGame(undefined, firstPlayer);
    setScreen('multiplayer');
    setPendingMode(null);
  };

  if (route === 'local') {
    if (screen === 'menu') {
      return (
        <>
          <MainMenu
            onSelectOption={handleMenuSelect}
            aiDifficulty={aiDifficulty}
            onChangeAiDifficulty={setAiDifficulty}
          />
          {showPreGameSetup && pendingMode && (
            <PreGameSetupModal
              mode={pendingMode}
              onCancel={handleClosePreGameSetup}
              onStart={handleStartFromPreGameSetup}
            />
          )}
        </>
      );
    }
    if (screen === 'login') {
      return (
        <>
          <MainMenu
            onSelectOption={handleMenuSelect}
            aiDifficulty={aiDifficulty}
            onChangeAiDifficulty={setAiDifficulty}
          />
          <LoginModal onClose={() => setScreen('menu')} />
        </>
      );
    }
    if (screen === 'solo') {
      return <GameScreen onBackToMenu={() => setScreen('menu')} aiDifficulty={aiDifficulty} />;
    }
    if (screen === 'multiplayer') {
      return <GameScreen onBackToMenu={() => setScreen('menu')} aiDifficulty={aiDifficulty} localMultiplayer />;
    }

    // Placeholder for remaining screens
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="etched-wood-border dialog-pop" style={{
          width: 'min(560px, 96vw)',
          borderRadius: 12,
          padding: 20,
          background: 'var(--surface)',
          color: 'var(--text)',
          textAlign: 'center',
        }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold)', fontSize: 28, margin: '0 0 10px 0' }}>
            {screen.charAt(0).toUpperCase() + screen.slice(1)}
          </h1>
          <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}>This screen is coming soon.</div>
          <button
            onClick={() => setScreen('menu')}
            style={{
              background: 'var(--surface-accent)',
              border: '1px solid var(--border-light)',
              color: 'var(--gold)',
              borderRadius: 8,
              padding: '10px 16px',
              cursor: 'pointer',
            }}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return <CastRouter route={route} aiDifficulty={aiDifficulty} />;
}

function CastRouter({ route, aiDifficulty }: { route: 'tv' | 'play'; aiDifficulty: AIDifficulty }) {
  const ws = useWebSocketGame();

  // Show lobby until game state arrives
  if (!ws.publicState) {
    return <CastLobby ws={ws} role={route === 'tv' ? 'tv' : 'player'} aiDifficulty={aiDifficulty} />;
  }

  if (route === 'tv') {
    return <TVScreen ws={ws} />;
  }

  return <PlayerScreen ws={ws} />;
}
