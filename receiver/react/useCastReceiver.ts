// ============================================================================
// React Chromecast Receiver — Cast Receiver Hook
// Manages CAF context, SYNC_ROOM messages, SSE streaming with polling fallback,
// and converts CastPublicRoomPayload into WebSocketGameState for TVScreen.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WebSocketGameState } from '../../src/multiplayer/client.ts';
import type { PublicGameState, RoomMode, PlayerSlot, AudioEvent } from '../../src/multiplayer/types.ts';
import type { GameAction } from '../../src/engine/types.ts';
import type { AIDifficulty } from '../../src/ai/difficulties/index.ts';

const NAMESPACE = 'urn:x-cast:com.jambo.game.v1';
const POLL_INTERVAL_MS = 1500;
const STREAM_RETRY_MS = 4000;

interface RoomState {
  roomCode: string | null;
  roomMode: RoomMode | null;
  senderPlayerSlot: PlayerSlot | null;
  apiBaseUrl: string | null;
  castAccessToken: string | null;
}

interface CastPublicRoomPayload {
  roomCode: string;
  roomMode: RoomMode;
  started: boolean;
  publicState: PublicGameState | null;
  updatedAtMs: number;
}

// No-op stubs — the receiver is read-only
const noopCreateRoom = (_mode: RoomMode, _aiDifficulty?: AIDifficulty) => {};
const noopJoinRoom = (_code: string) => {};
const noopResetRoomState = () => {};
const noopSendAction = (_action: GameAction) => {};
const noopRequestRematch = () => {};
const noopClearError = () => {};
const noopClearAudioEvent = () => {};

declare const cast: {
  framework: {
    CastReceiverContext: {
      getInstance(): CastReceiverContextInstance;
    };
  };
};

interface CastReceiverContextInstance {
  addCustomMessageListener(namespace: string, handler: (event: CustomMessageEvent) => void): void;
  sendCustomMessage(namespace: string, senderId: string, data: unknown): void;
  start(): void;
  getPlayerManager(): { setMessageInterceptor(type: unknown, handler: (data: unknown) => unknown): void };
}

interface CustomMessageEvent {
  senderId: string;
  data: unknown;
}

export function useCastReceiver(): WebSocketGameState {
  const [publicState, setPublicState] = useState<PublicGameState | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomMode, setRoomMode] = useState<RoomMode | null>(null);
  const [castAccessToken, setCastAccessToken] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const roomStateRef = useRef<RoomState>({
    roomCode: null,
    roomMode: null,
    senderPlayerSlot: null,
    apiBaseUrl: null,
    castAccessToken: null,
  });

  const pollTimerRef = useRef<number | null>(null);
  const streamSourceRef = useRef<EventSource | null>(null);
  const streamRetryTimerRef = useRef<number | null>(null);

  // --- Polling fallback ---

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const closeStreamSource = useCallback(() => {
    if (streamSourceRef.current !== null) {
      streamSourceRef.current.close();
      streamSourceRef.current = null;
    }
  }, []);

  const clearStreamRetryTimer = useCallback(() => {
    if (streamRetryTimerRef.current !== null) {
      window.clearTimeout(streamRetryTimerRef.current);
      streamRetryTimerRef.current = null;
    }
  }, []);

  const applySnapshot = useCallback((snapshot: CastPublicRoomPayload) => {
    if (snapshot.publicState) {
      setPublicState(snapshot.publicState);
      setConnected(true);
    }
  }, []);

  const pollPublicRoomState = useCallback(async () => {
    const rs = roomStateRef.current;
    if (!rs.roomCode || !rs.apiBaseUrl || !rs.castAccessToken) return;

    const endpoint = rs.apiBaseUrl.replace(/\/+$/, '') +
      '/api/cast/public-room?code=' + encodeURIComponent(rs.roomCode) +
      '&token=' + encodeURIComponent(rs.castAccessToken);

    try {
      const response = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json() as CastPublicRoomPayload;
      applySnapshot(data);
    } catch {
      // polling error — silently retry next interval
    }
  }, [applySnapshot]);

  const startPolling = useCallback(() => {
    clearPollTimer();
    const rs = roomStateRef.current;
    if (!rs.roomCode || !rs.apiBaseUrl || !rs.castAccessToken) return;
    void pollPublicRoomState();
    pollTimerRef.current = window.setInterval(() => {
      void pollPublicRoomState();
    }, POLL_INTERVAL_MS);
  }, [clearPollTimer, pollPublicRoomState]);

  const startStream = useCallback(() => {
    closeStreamSource();
    clearStreamRetryTimer();
    const rs = roomStateRef.current;
    if (!rs.roomCode || !rs.apiBaseUrl || !rs.castAccessToken) return;

    const endpoint = rs.apiBaseUrl.replace(/\/+$/, '') +
      '/api/cast/stream-room?code=' + encodeURIComponent(rs.roomCode) +
      '&token=' + encodeURIComponent(rs.castAccessToken);

    try {
      const es = new EventSource(endpoint);
      streamSourceRef.current = es;

      es.addEventListener('room', (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data) as CastPublicRoomPayload;
          applySnapshot(data);
        } catch {
          // parse error
        }
      });

      es.addEventListener('room_deleted', () => {
        setPublicState(null);
        setConnected(false);
      });

      es.onerror = () => {
        closeStreamSource();
        // Fall back to polling, then retry stream
        startPolling();
        clearStreamRetryTimer();
        streamRetryTimerRef.current = window.setTimeout(() => {
          clearPollTimer();
          startStream();
        }, STREAM_RETRY_MS);
      };
    } catch {
      // EventSource creation failed — use polling
      startPolling();
    }
  }, [closeStreamSource, clearStreamRetryTimer, applySnapshot, startPolling, clearPollTimer]);

  const restartRealtimeSync = useCallback(() => {
    clearPollTimer();
    closeStreamSource();
    clearStreamRetryTimer();
    setPublicState(null);

    const rs = roomStateRef.current;
    if (!rs.roomCode || !rs.apiBaseUrl || !rs.castAccessToken) {
      setConnected(false);
      return;
    }

    if (typeof EventSource === 'function') {
      startStream();
    } else {
      startPolling();
    }
  }, [clearPollTimer, closeStreamSource, clearStreamRetryTimer, startStream, startPolling]);

  // --- CAF initialization (runs once) ---

  useEffect(() => {
    let context: CastReceiverContextInstance;
    try {
      context = cast.framework.CastReceiverContext.getInstance();
    } catch {
      // No CAF SDK — running in browser for testing. Show waiting state.
      return;
    }

    const handleCustomMessage = (event: CustomMessageEvent) => {
      const senderId = event.senderId;
      let payload: Record<string, unknown>;

      if (typeof event.data === 'object' && event.data !== null) {
        payload = event.data as Record<string, unknown>;
      } else {
        try {
          payload = JSON.parse(event.data as string) as Record<string, unknown>;
        } catch {
          context.sendCustomMessage(NAMESPACE, senderId, {
            type: 'RECEIVER_ERROR',
            code: 'INVALID_PAYLOAD',
            message: 'Payload is not valid JSON.',
          });
          return;
        }
      }

      if (payload.type !== 'SYNC_ROOM') return;

      const code = payload.roomCode as string;
      const mode = payload.roomMode as RoomMode;
      const token = payload.castAccessToken as string;
      const apiBaseUrl = (payload.apiBaseUrl as string) || window.location.origin;

      roomStateRef.current = {
        roomCode: code,
        roomMode: mode,
        senderPlayerSlot: (payload.senderPlayerSlot ?? null) as PlayerSlot | null,
        apiBaseUrl,
        castAccessToken: token,
      };

      setRoomCode(code);
      setRoomMode(mode);
      setCastAccessToken(token);
      restartRealtimeSync();

      // Acknowledge
      context.sendCustomMessage(NAMESPACE, senderId, {
        type: 'RECEIVER_ROOM_SYNCED',
        roomCode: code,
        timestampMs: Date.now(),
      });
    };

    context.addCustomMessageListener(NAMESPACE, handleCustomMessage);
    context.start({ disableIdleTimeout: true });

    return () => {
      clearPollTimer();
      closeStreamSource();
      clearStreamRetryTimer();
    };
  }, [restartRealtimeSync, clearPollTimer, closeStreamSource, clearStreamRetryTimer]);

  return {
    connected,
    roomCode,
    castAccessToken,
    playerSlot: null,
    roomMode,
    publicState,
    privateState: null,
    audioEvent: null,
    aiMessage: null,
    error: null,
    gameOver: publicState?.phase === 'GAME_OVER',
    playerJoined: null,
    playerDisconnected: null,
    rematchVotes: [],
    rematchRequired: [],
    createRoom: noopCreateRoom,
    joinRoom: noopJoinRoom,
    resetRoomState: noopResetRoomState,
    sendAction: noopSendAction,
    requestRematch: noopRequestRematch,
    clearError: noopClearError,
    clearAudioEvent: noopClearAudioEvent,
  };
}
