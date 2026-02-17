// ============================================================================
// Cast Mode — Lobby UI
// TV: create room → show code. Player: enter code → join.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WebSocketGameState } from '../multiplayer/client.ts';
import type { ConnectionRole, RoomMode } from '../multiplayer/types.ts';
import type { AIDifficulty } from '../ai/difficulties/index.ts';
import { ResolveMegaView } from './ResolveMegaView.tsx';

interface CastLobbyProps {
  ws: WebSocketGameState;
  role: ConnectionRole;
  aiDifficulty: AIDifficulty;
  roomMode: RoomMode | null;
}

export function CastLobby({ ws, role, aiDifficulty, roomMode }: CastLobbyProps) {
  if (role === 'tv') {
    return <TVLobby ws={ws} aiDifficulty={aiDifficulty} roomMode={roomMode ?? 'ai'} />;
  }
  return <PlayerLobby ws={ws} />;
}

function TVLobby({ ws, aiDifficulty, roomMode }: { ws: WebSocketGameState; aiDifficulty: AIDifficulty; roomMode: RoomMode }) {
  const lastCreateAttemptAt = useRef(0);

  const requestCreateRoom = useCallback(() => {
    const now = Date.now();
    if (now - lastCreateAttemptAt.current < 1200) {
      return;
    }
    lastCreateAttemptAt.current = now;
    ws.createRoom(roomMode, aiDifficulty);
  }, [ws.createRoom, roomMode, aiDifficulty]);

  useEffect(() => {
    if (!ws.connected || ws.roomCode) {
      return;
    }

    // Immediate attempt, then retry until ROOM_CREATED arrives.
    requestCreateRoom();
    const timer = window.setInterval(() => requestCreateRoom(), 2000);
    return () => window.clearInterval(timer);
  }, [ws.connected, ws.roomCode, requestCreateRoom]);

  if (!ws.connected) {
    return (
      <LobbyContainer>
        <div style={{ fontSize: 20, color: 'var(--text-muted)' }}>Connecting to server...</div>
      </LobbyContainer>
    );
  }

  if (!ws.roomCode) {
    return (
      <LobbyContainer>
        <div style={{ fontSize: 20, color: 'var(--text-muted)' }}>Creating room...</div>
        {ws.error && (
          <div style={{ fontSize: 14, color: '#ff9977', marginTop: 12 }}>{ws.error}</div>
        )}
      </LobbyContainer>
    );
  }

  const modeLabel = roomMode === 'ai' ? 'Solo (vs AI)' : 'Multiplayer';
  const joinUrl = `${window.location.origin}/#/play`;
  const joinPrefix = roomMode === 'ai' ? 'Open ' : 'Both players: open ';
  const joinSuffix = ' on your phone and enter this code';

  return (
    <LobbyContainer>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
        {modeLabel}
      </div>
      <div style={{ fontSize: 20, color: 'var(--text-muted)' }}>
        Room Code
      </div>
      <div style={{
        fontSize: 72,
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        color: 'var(--gold)',
        letterSpacing: 12,
        marginBottom: 16,
      }}>
        {ws.roomCode}
      </div>
      <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>
        {joinPrefix}
        <a
          href={joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--gold)', textDecoration: 'underline' }}
        >
          {joinUrl.replace(window.location.origin, '')}
        </a>
        {joinSuffix}
      </div>
      {ws.playerJoined !== null && (
        <div style={{ fontSize: 16, color: 'var(--accent-green, #7c7)', marginTop: 16 }}>
          Player {ws.playerJoined + 1} joined!
        </div>
      )}
      {ws.error && (
        <div style={{ fontSize: 14, color: '#ff9977', marginTop: 12 }}>{ws.error}</div>
      )}
    </LobbyContainer>
  );
}

function PlayerLobby({ ws }: { ws: WebSocketGameState }) {
  const [code, setCode] = useState('');
  const [joined, setJoined] = useState(false);

  if (!ws.connected) {
    return (
      <LobbyContainer>
        <div style={{ fontSize: 20, color: 'var(--text-muted)' }}>Connecting to server...</div>
      </LobbyContainer>
    );
  }

  // Already joined, waiting for game
  if (joined || ws.playerSlot !== null) {
    return (
      <LobbyContainer>
        <div style={{ fontSize: 24, fontFamily: 'var(--font-heading)', color: 'var(--gold)', marginBottom: 16 }}>
          Joined Room {ws.roomCode}
        </div>
        <div style={{ fontSize: 16, color: 'var(--text-muted)' }}>
          {ws.playerSlot !== null
            ? `You are Player ${ws.playerSlot + 1}. Waiting for game to start...`
            : 'Waiting for game to start...'}
        </div>
        {ws.error && (
          <div style={{ fontSize: 14, color: '#ff9977', marginTop: 12 }}>{ws.error}</div>
        )}
      </LobbyContainer>
    );
  }

  return (
    <LobbyContainer>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', color: 'var(--gold)', marginBottom: 24 }}>
        Join Game
      </div>
      <div style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 16 }}>
        Enter the room code shown on the TV:
      </div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        placeholder="0000"
        style={{
          fontSize: 36,
          fontFamily: 'var(--font-heading)',
          textAlign: 'center',
          letterSpacing: 8,
          width: 200,
          padding: '12px 16px',
          background: 'var(--surface-light)',
          border: '2px solid var(--border-light)',
          borderRadius: 12,
          color: 'var(--text)',
          marginBottom: 24,
          outline: 'none',
        }}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && code.length === 4) {
            ws.joinRoom(code, 'player');
            setJoined(true);
          }
        }}
      />
      <LobbyButton
        onClick={() => { ws.joinRoom(code, 'player'); setJoined(true); }}
        disabled={code.length !== 4}
      >
        Join
      </LobbyButton>
      {ws.error && (
        <div style={{ fontSize: 14, color: '#ff9977', marginTop: 12 }}>{ws.error}</div>
      )}
    </LobbyContainer>
  );
}

// --- Shared UI ---

function LobbyContainer({ children }: { children: React.ReactNode }) {
  return (
    <ResolveMegaView verticalAlign="center">
      <div
        className="etched-wood-border dialog-pop"
        style={{
          width: 'min(720px, 96vw)',
          margin: '0 auto',
          borderRadius: 14,
          padding: 22,
          backgroundImage: [
            'linear-gradient(0deg, rgba(180,170,155,0.08) 0.3px, transparent 0.3px)',
            'linear-gradient(90deg, rgba(180,170,155,0.08) 0.3px, transparent 0.3px)',
            'linear-gradient(135deg, rgba(200,190,175,0.04) 0.3px, transparent 0.3px)',
            'linear-gradient(45deg, rgba(200,190,175,0.04) 0.3px, transparent 0.3px)',
          ].join(', '),
          backgroundSize: '1px 1px, 1px 1px, 1.5px 1.5px, 1.5px 1.5px',
          backgroundColor: 'var(--surface)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {children}
      </div>
    </ResolveMegaView>
  );
}

function LobbyButton({ children, onClick, disabled }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 18,
        fontFamily: 'var(--font-heading)',
        padding: '14px 32px',
        background: disabled ? 'var(--surface-light)' : 'var(--surface-accent)',
        color: disabled ? 'var(--text-muted)' : 'var(--gold)',
        border: '1px solid var(--border-light)',
        borderRadius: 12,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background-color var(--motion-fast) var(--anim-ease-standard)',
      }}
    >
      {children}
    </button>
  );
}
