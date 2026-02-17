// ============================================================================
// Simple hash-based router for Cast Mode
// No hash → normal local game | /#/tv → TV screen | /#/play → Player screen
// ============================================================================

import { useCallback, useState, useEffect } from 'react';
import { GameScreen } from './GameScreen.tsx';
import { CastLobby } from './CastLobby.tsx';
import { TVScreen } from './TVScreen.tsx';
import { PlayerScreen } from './PlayerScreen.tsx';
import { MainMenu } from './screens/MainMenu.tsx';
import { LoginModal } from './screens/LoginModal.tsx';
import { PreGameSetupModal } from './screens/PreGameSetupModal.tsx';
import { FirstPlayerReveal } from './FirstPlayerReveal.tsx';
import { TutorialOverlay } from './TutorialOverlay.tsx';
import { useWebSocketGame } from '../multiplayer/client.ts';
import type { AIDifficulty } from '../ai/difficulties/index.ts';
import { useGameStore } from '../hooks/useGameStore.ts';

type Route = 'local' | 'tv' | 'play';
type Screen = 'menu' | 'solo' | 'multiplayer' | 'login' | 'settings';

function getRoute(): Route {
  const hash = window.location.hash;
  if (hash.startsWith('#/tv')) return 'tv';
  if (hash === '#/play' || hash === '#/play/') return 'play';
  return 'local';
}

function getRoomModeFromHash(): import('../multiplayer/types.ts').RoomMode | null {
  const hash = window.location.hash;
  if (hash.startsWith('#/tv/ai')) return 'ai';
  if (hash.startsWith('#/tv/pvp')) return 'pvp';
  return null;
}

function getRandomFirstPlayer(): 0 | 1 {
  return Math.random() < 0.5 ? 0 : 1;
}

export function Router() {
  const [route, setRoute] = useState<Route>(getRoute);
  const [screen, setScreen] = useState<Screen>('menu');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [pendingMode, setPendingMode] = useState<'solo' | 'multiplayer' | null>(null);
  const [showPreGameSetup, setShowPreGameSetup] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [revealFirstPlayer, setRevealFirstPlayer] = useState<0 | 1 | null>(null);
  const [pendingScreen, setPendingScreen] = useState<'solo' | 'multiplayer' | null>(null);
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
    aiDifficulty: selectedDifficulty,
  }: {
    castMode: boolean;
    aiDifficulty: AIDifficulty;
  }) => {
    if (!pendingMode) {
      return;
    }

    setShowPreGameSetup(false);
    setAiDifficulty(selectedDifficulty);

    if (castMode) {
      const roomMode = pendingMode === 'solo' ? 'ai' : 'pvp';
      window.location.hash = `#/tv/${roomMode}`;
      setScreen('menu');
      setPendingMode(null);
      return;
    }

    const firstPlayer = getRandomFirstPlayer();
    newGame(undefined, firstPlayer);
    setRevealFirstPlayer(firstPlayer);
    setPendingScreen(pendingMode);
    setPendingMode(null);
  };

  const handleRevealComplete = useCallback(() => {
    if (pendingScreen) {
      setScreen(pendingScreen);
    }
    setRevealFirstPlayer(null);
    setPendingScreen(null);
  }, [pendingScreen]);

  // Show first-player reveal overlay on top of the menu
  if (revealFirstPlayer !== null) {
    return (
      <FirstPlayerReveal
        firstPlayer={revealFirstPlayer}
        onComplete={handleRevealComplete}
      />
    );
  }

  if (route === 'local') {
    if (screen === 'menu') {
      return (
        <>
          <MainMenu
            onSelectOption={handleMenuSelect}
            onTutorial={() => setShowTutorial(true)}
          />
          {showPreGameSetup && pendingMode && (
            <PreGameSetupModal
              mode={pendingMode}
              aiDifficulty={aiDifficulty}
              onCancel={handleClosePreGameSetup}
              onStart={handleStartFromPreGameSetup}
            />
          )}
          {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
        </>
      );
    }
    if (screen === 'login') {
      return (
        <>
          <MainMenu
            onSelectOption={handleMenuSelect}
            onTutorial={() => setShowTutorial(true)}
          />
          <LoginModal onClose={() => setScreen('menu')} />
          {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
        </>
      );
    }
    if (screen === 'solo') {
      return <GameScreen onBackToMenu={() => setScreen('menu')} aiDifficulty={aiDifficulty} />;
    }
    if (screen === 'multiplayer') {
      return <GameScreen onBackToMenu={() => setScreen('menu')} aiDifficulty={aiDifficulty} localMultiplayer />;
    }

    if (screen === 'settings') {
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
              Settings
            </h1>
            <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              Version {__APP_VERSION__}
            </div>
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

    return null;
  }

  return <CastRouter route={route} aiDifficulty={aiDifficulty} roomMode={getRoomModeFromHash()} />;
}

function CastRouter({ route, aiDifficulty, roomMode }: { route: 'tv' | 'play'; aiDifficulty: AIDifficulty; roomMode: import('../multiplayer/types.ts').RoomMode | null }) {
  const ws = useWebSocketGame();

  // Show lobby until game state arrives
  if (!ws.publicState) {
    return <CastLobby ws={ws} role={route === 'tv' ? 'tv' : 'player'} aiDifficulty={aiDifficulty} roomMode={roomMode} />;
  }

  if (route === 'tv') {
    return <TVScreen ws={ws} />;
  }

  return <PlayerScreen ws={ws} />;
}
