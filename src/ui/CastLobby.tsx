// ============================================================================
// Cast Mode — Lobby UI
// TV: create room → show code. Player: enter code → join.
// ============================================================================

import { useState } from 'react';
import type { WebSocketGameState } from '../multiplayer/client.ts';
import type { ConnectionRole, RoomMode } from '../multiplayer/types.ts';
import type { AIDifficulty } from '../ai/difficulties/index.ts';

interface CastLobbyProps {
  ws: WebSocketGameState;
  role: ConnectionRole;
  aiDifficulty: AIDifficulty;
}

export function CastLobby({ ws, role, aiDifficulty }: CastLobbyProps) {
  if (role === 'tv') {
    return <TVLobby ws={ws} aiDifficulty={aiDifficulty} />;
  }
  return <PlayerLobby ws={ws} />;
}

function TVLobby({ ws, aiDifficulty }: { ws: WebSocketGameState; aiDifficulty: AIDifficulty }) {
  const [mode, setMode] = useState<RoomMode | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>(aiDifficulty);

  if (!ws.connected) {
    return (
      <LobbyContainer>
        <div style={{ fontSize: 20, color: 'var(--text-muted)' }}>Connecting to server...</div>
      </LobbyContainer>
    );
  }

  // Step 1: choose mode
  if (!ws.roomCode && !mode) {
    return (
      <LobbyContainer>
        <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', color: 'var(--gold)', marginBottom: 24 }}>
          Cast Mode
        </div>
        <div style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 32 }}>
          Choose game mode:
        </div>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
          <span>AI Difficulty:</span>
          <select
            value={selectedDifficulty}
            onChange={(event) => setSelectedDifficulty(event.target.value as AIDifficulty)}
            style={{
              background: 'var(--surface-light)',
              color: 'var(--text)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              padding: '6px 8px',
            }}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <LobbyButton onClick={() => { setMode('ai'); ws.createRoom('ai', selectedDifficulty); }}>
            Human vs AI
          </LobbyButton>
          <LobbyButton onClick={() => { setMode('pvp'); ws.createRoom('pvp', selectedDifficulty); }}>
            Human vs Human
          </LobbyButton>
        </div>
      </LobbyContainer>
    );
  }

  // Step 2: show room code, wait for players
  return (
    <LobbyContainer>
      <div style={{ fontSize: 20, color: 'var(--text-muted)', marginBottom: 16 }}>
        Room Code
      </div>
      <div style={{
        fontSize: 72,
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        color: 'var(--gold)',
        letterSpacing: 12,
        marginBottom: 32,
      }}>
        {ws.roomCode}
      </div>
      <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>
        {mode === 'ai'
          ? 'Open /#/play on your phone and enter this code'
          : 'Both players: open /#/play and enter this code'}
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 24,
    }}>
      {children}
    </div>
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
        border: '2px solid var(--border-light)',
        borderRadius: 12,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
