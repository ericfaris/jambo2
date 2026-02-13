// ============================================================================
// Simple hash-based router for Cast Mode
// No hash → normal local game | /#/tv → TV screen | /#/play → Player screen
// ============================================================================

import { useState, useEffect } from 'react';
import { GameScreen } from './GameScreen.tsx';
import { CastLobby } from './CastLobby.tsx';
import { TVScreen } from './TVScreen.tsx';
import { PlayerScreen } from './PlayerScreen.tsx';
import { useWebSocketGame } from '../multiplayer/client.ts';

type Route = 'local' | 'tv' | 'play';

function getRoute(): Route {
  const hash = window.location.hash;
  if (hash === '#/tv' || hash === '#/tv/') return 'tv';
  if (hash === '#/play' || hash === '#/play/') return 'play';
  return 'local';
}

export function Router() {
  const [route, setRoute] = useState<Route>(getRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (route === 'local') {
    return <GameScreen />;
  }

  return <CastRouter route={route} />;
}

function CastRouter({ route }: { route: 'tv' | 'play' }) {
  const ws = useWebSocketGame();

  // Show lobby until game state arrives
  if (!ws.publicState) {
    return <CastLobby ws={ws} role={route === 'tv' ? 'tv' : 'player'} />;
  }

  if (route === 'tv') {
    return <TVScreen ws={ws} />;
  }

  return <PlayerScreen ws={ws} />;
}
