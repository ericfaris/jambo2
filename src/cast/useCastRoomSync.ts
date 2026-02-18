import { useEffect, useMemo, useRef, useState } from 'react';
import type { PlayerSlot, RoomMode } from '../multiplayer/types.ts';
import { getCastSessionController, isCastSdkEnabled } from './factory.ts';
import type { ReceiverToSenderMessage } from './contracts.ts';

export interface CastRoomSyncState {
  status: 'disabled' | 'idle' | 'syncing' | 'synced' | 'error';
  error: string | null;
  syncedRoomCode: string | null;
}

interface CastRoomSyncOptions {
  roomCode: string | null;
  roomMode: RoomMode | null;
  senderPlayerSlot: PlayerSlot | null;
  castAccessToken: string | null;
}

export function useCastRoomSync({
  roomCode,
  roomMode,
  senderPlayerSlot,
  castAccessToken,
}: CastRoomSyncOptions): CastRoomSyncState {
  const enabled = isCastSdkEnabled();
  const [state, setState] = useState<CastRoomSyncState>({
    status: enabled ? 'idle' : 'disabled',
    error: null,
    syncedRoomCode: null,
  });
  const syncAttemptRef = useRef(0);
  const lastRequestedKeyRef = useRef<string | null>(null);

  const syncKey = useMemo(() => {
    if (!roomCode || !roomMode) return null;
    return `${roomCode}:${roomMode}:${senderPlayerSlot ?? 'tv'}:${castAccessToken ?? 'no-token'}`;
  }, [roomCode, roomMode, senderPlayerSlot, castAccessToken]);

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'disabled', error: null, syncedRoomCode: null });
      return;
    }

    const controller = getCastSessionController();

    const onReceiverMessage = (message: ReceiverToSenderMessage) => {
      if (message.type === 'RECEIVER_ROOM_SYNCED') {
        setState({
          status: 'synced',
          error: null,
          syncedRoomCode: message.roomCode,
        });
        return;
      }
      if (message.type === 'RECEIVER_ERROR') {
        setState({
          status: 'error',
          error: message.message,
          syncedRoomCode: null,
        });
      }
    };

    const unsubscribeMessages = controller.onMessage(onReceiverMessage);

    const trySync = async (): Promise<void> => {
      if (!syncKey || !roomCode || !roomMode) {
        setState((previous) => ({
          ...previous,
          status: 'idle',
          error: null,
        }));
        return;
      }

      if (!controller.getSession()) {
        setState((previous) => ({
          ...previous,
          status: 'idle',
          error: null,
        }));
        return;
      }

      if (lastRequestedKeyRef.current === syncKey) {
        return;
      }

      const attempt = syncAttemptRef.current + 1;
      syncAttemptRef.current = attempt;
      lastRequestedKeyRef.current = syncKey;
      setState((previous) => ({ ...previous, status: 'syncing', error: null }));

      try {
        await controller.sendMessage({
          type: 'SYNC_ROOM',
          roomCode,
          roomMode,
          senderPlayerSlot,
          apiBaseUrl: window.location.origin,
          castAccessToken: castAccessToken ?? undefined,
        });
      } catch (error) {
        if (syncAttemptRef.current !== attempt) return;
        lastRequestedKeyRef.current = null;
        setState({
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to sync room to receiver.',
          syncedRoomCode: null,
        });
      }
    };

    const unsubscribeSession = controller.onSessionChanged(() => {
      lastRequestedKeyRef.current = null;
      void trySync();
    });

    void trySync();
    return () => {
      unsubscribeMessages();
      unsubscribeSession();
    };
  }, [enabled, roomCode, roomMode, senderPlayerSlot, syncKey, castAccessToken]);

  return state;
}
