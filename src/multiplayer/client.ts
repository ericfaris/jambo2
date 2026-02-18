// ============================================================================
// Cast Mode — Client WebSocket Hook
// Manages WebSocket connection, sends/receives messages, reconnects.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  ClientMessage,
  ServerMessage,
  PublicGameState,
  PrivateGameState,
  RoomMode,
  ConnectionRole,
  PlayerSlot,
  AudioEvent,
} from './types.ts';
import type { GameAction } from '../engine/types.ts';
import type { AIDifficulty } from '../ai/difficulties/index.ts';

export interface WebSocketGameState {
  connected: boolean;
  roomCode: string | null;
  castAccessToken: string | null;
  playerSlot: PlayerSlot | null;
  roomMode: RoomMode | null;
  publicState: PublicGameState | null;
  privateState: PrivateGameState | null;
  audioEvent: AudioEvent | null;
  aiMessage: string | null;
  error: string | null;
  gameOver: boolean;
  playerJoined: PlayerSlot | null;
  playerDisconnected: PlayerSlot | null;
  rematchVotes: PlayerSlot[];
  rematchRequired: PlayerSlot[];
  createRoom: (mode: RoomMode, aiDifficulty?: AIDifficulty) => void;
  joinRoom: (code: string, role: ConnectionRole) => void;
  sendAction: (action: GameAction) => void;
  requestRematch: () => void;
  clearError: () => void;
  clearAudioEvent: () => void;
}

export function useWebSocketGame(): WebSocketGameState {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempt = useRef(0);

  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [castAccessToken, setCastAccessToken] = useState<string | null>(null);
  const [playerSlot, setPlayerSlot] = useState<PlayerSlot | null>(null);
  const [roomMode, setRoomMode] = useState<RoomMode | null>(null);
  const [publicState, setPublicState] = useState<PublicGameState | null>(null);
  const [privateState, setPrivateState] = useState<PrivateGameState | null>(null);
  const [audioEvent, setAudioEvent] = useState<AudioEvent | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [playerJoined, setPlayerJoined] = useState<PlayerSlot | null>(null);
  const [playerDisconnected, setPlayerDisconnected] = useState<PlayerSlot | null>(null);
  const [rematchVotes, setRematchVotes] = useState<PlayerSlot[]>([]);
  const [rematchRequired, setRematchRequired] = useState<PlayerSlot[]>([]);

  // Pending join info for reconnection
  const pendingJoin = useRef<{ code: string; role: ConnectionRole; reconnectToken?: string } | null>(null);

  const getReconnectStorageKey = useCallback((code: string, role: ConnectionRole) => {
    return `jambo:reconnect:${code}:${role}`;
  }, []);

  const sendRaw = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'ROOM_CREATED':
        setRoomCode(msg.code);
        if (msg.castAccessToken) {
          setCastAccessToken(msg.castAccessToken);
        }
        break;
      case 'JOINED':
        setPlayerSlot(msg.playerSlot);
        setRoomMode(msg.mode);
        if (msg.castAccessToken) {
          setCastAccessToken(msg.castAccessToken);
        }
        if (pendingJoin.current && msg.reconnectToken) {
          const key = getReconnectStorageKey(pendingJoin.current.code, pendingJoin.current.role);
          window.sessionStorage.setItem(key, msg.reconnectToken);
          pendingJoin.current = {
            ...pendingJoin.current,
            reconnectToken: msg.reconnectToken,
          };
        }
        break;
      case 'GAME_STATE':
        setPublicState(msg.public);
        setPrivateState(msg.private);
        setAudioEvent(msg.audioEvent);
        setAiMessage(msg.aiMessage);
        if (msg.public.phase !== 'GAME_OVER') {
          setGameOver(false);
          setRematchVotes([]);
          setRematchRequired([]);
        }
        break;
      case 'PLAYER_JOINED':
        setPlayerJoined(msg.playerSlot);
        break;
      case 'PLAYER_DISCONNECTED':
        setPlayerDisconnected(msg.playerSlot);
        break;
      case 'ERROR':
        setError(msg.message);
        break;
      case 'REMATCH_STATUS':
        setRematchVotes(msg.votes);
        setRematchRequired(msg.required);
        break;
      case 'GAME_OVER':
        setPublicState(msg.public);
        setGameOver(true);
        break;
    }
  }, [getReconnectStorageKey]);

  const connect = useCallback(() => {
    // Determine WebSocket URL (use /ws path for Vite proxy)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectAttempt.current = 0;

      // Re-join room on reconnect
      if (pendingJoin.current) {
        sendRaw({
          type: 'JOIN_ROOM',
          code: pendingJoin.current.code,
          role: pendingJoin.current.role,
          reconnectToken: pendingJoin.current.reconnectToken,
        });
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as ServerMessage;
        handleMessage(msg);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;

      // Exponential backoff reconnect
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000);
      reconnectAttempt.current++;
      reconnectTimer.current = setTimeout(() => connect(), delay);
    };

    ws.onerror = () => {
      // onclose will fire after onerror
    };
  }, [handleMessage, sendRaw]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const createRoom = useCallback((mode: RoomMode, aiDifficulty?: AIDifficulty) => {
    sendRaw({ type: 'CREATE_ROOM', mode, aiDifficulty });
  }, [sendRaw]);

  const joinRoom = useCallback((code: string, role: ConnectionRole) => {
    const key = getReconnectStorageKey(code, role);
    const reconnectToken = window.sessionStorage.getItem(key) ?? undefined;
    pendingJoin.current = { code, role, reconnectToken };
    setRoomCode(code);
    sendRaw({ type: 'JOIN_ROOM', code, role, reconnectToken });
  }, [getReconnectStorageKey, sendRaw]);

  const sendAction = useCallback((action: GameAction) => {
    sendRaw({ type: 'GAME_ACTION', action });
  }, [sendRaw]);

  const requestRematch = useCallback(() => {
    sendRaw({ type: 'REQUEST_REMATCH' });
  }, [sendRaw]);

  const clearError = useCallback(() => setError(null), []);
  const clearAudioEvent = useCallback(() => setAudioEvent(null), []);

  return {
    connected,
    roomCode,
    castAccessToken,
    playerSlot,
    roomMode,
    publicState,
    privateState,
    audioEvent,
    aiMessage,
    error,
    gameOver,
    playerJoined,
    playerDisconnected,
    rematchVotes,
    rematchRequired,
    createRoom,
    joinRoom,
    sendAction,
    requestRematch,
    clearError,
    clearAudioEvent,
  };
}
