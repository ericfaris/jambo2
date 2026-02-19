// ============================================================================
// Simple hash-based router
// No hash -> normal app flow | /#/play -> join cast room as a player
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { GameScreen } from './GameScreen.tsx';
import { CastLobby } from './CastLobby.tsx';
import { PlayerScreen } from './PlayerScreen.tsx';
import { MainMenu } from './screens/MainMenu.tsx';
import { LoginModal } from './screens/LoginModal.tsx';
import { PreGameSetupModal } from './screens/PreGameSetupModal.tsx';
import { FirstPlayerReveal } from './FirstPlayerReveal.tsx';
import { TutorialOverlay } from './TutorialOverlay.tsx';
import { useWebSocketGame } from '../multiplayer/client.ts';
import type { AIDifficulty } from '../ai/difficulties/index.ts';
import type { RoomMode } from '../multiplayer/types.ts';
import { useGameStore } from '../hooks/useGameStore.ts';
import { getCastSessionController } from '../cast/factory.ts';

type Route = 'local' | 'play';
type Screen = 'menu' | 'solo' | 'multiplayer' | 'login' | 'settings' | 'castHost';

function getRoute(): Route {
  const hash = window.location.hash;
  if (hash === '#/play' || hash === '#/play/') return 'play';
  return 'local';
}

function getRandomFirstPlayer(): 0 | 1 {
  return Math.random() < 0.5 ? 0 : 1;
}

export function Router() {
  const ws = useWebSocketGame();
  const [route, setRoute] = useState<Route>(getRoute);
  const [screen, setScreen] = useState<Screen>('menu');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [pendingMode, setPendingMode] = useState<'solo' | 'multiplayer' | null>(null);
  const [showPreGameSetup, setShowPreGameSetup] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [revealFirstPlayer, setRevealFirstPlayer] = useState<0 | 1 | null>(null);
  const [pendingScreen, setPendingScreen] = useState<'solo' | 'multiplayer' | null>(null);
  const [castRoomMode, setCastRoomMode] = useState<RoomMode | null>(null);
  const [castStartError, setCastStartError] = useState<string | null>(null);
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
      setCastStartError(null);
      return;
    }
    setScreen(option);
  };

  const handleClosePreGameSetup = () => {
    setShowPreGameSetup(false);
    setPendingMode(null);
    setCastStartError(null);
  };

  const handleStartFromPreGameSetup = async ({
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
    setCastStartError(null);

    if (castMode) {
      ws.resetRoomState();
      try {
        const controller = getCastSessionController();
        if (!controller.getSession()) {
          await controller.requestSession();
        }
      } catch (error) {
        setCastStartError(error instanceof Error ? error.message : 'Failed to connect to Chromecast.');
        setShowPreGameSetup(true);
        return;
      }

      const roomMode = pendingMode === 'solo' ? 'ai' : 'pvp';
      setCastRoomMode(roomMode);
      setScreen('castHost');
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

  if (revealFirstPlayer !== null) {
    return (
      <FirstPlayerReveal
        firstPlayer={revealFirstPlayer}
        onComplete={handleRevealComplete}
      />
    );
  }

  if (route === 'play') {
    if (ws.playerSlot !== null && ws.publicState && ws.privateState) {
      return <PlayerScreen ws={ws} />;
    }
    return <CastLobby ws={ws} mode="join" aiDifficulty={aiDifficulty} roomMode={null} />;
  }

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
            onStart={(options) => { void handleStartFromPreGameSetup(options); }}
            castStartError={castStartError}
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

  if (screen === 'castHost' && castRoomMode) {
    if (ws.playerSlot !== null && ws.publicState && ws.privateState) {
      return <PlayerScreen ws={ws} />;
    }
    return <CastLobby ws={ws} mode="host" aiDifficulty={aiDifficulty} roomMode={castRoomMode} />;
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
