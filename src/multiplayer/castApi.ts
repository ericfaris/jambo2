import type { GameState } from '../engine/types.ts';
import type { RoomMode } from './types.ts';
import { extractPublicState } from './stateSplitter.ts';

export interface CastApiRoomLike {
  code: string;
  castAccessToken: string;
  mode: RoomMode;
  state: GameState | null;
  lastActivity: number;
}

export interface CastPublicRoomPayload {
  roomCode: string;
  roomMode: RoomMode;
  started: boolean;
  publicState: ReturnType<typeof extractPublicState> | null;
  updatedAtMs: number;
}

export type CastPublicRoomResult =
  | { status: 200; body: CastPublicRoomPayload }
  | { status: 400; body: { error: 'Invalid room code' } }
  | { status: 403; body: { error: 'Forbidden' } }
  | { status: 404; body: { error: 'Room not found' } };

export type CastRoomAccessResult =
  | { ok: true; room: CastApiRoomLike }
  | { ok: false; status: 400; body: { error: 'Invalid room code' } }
  | { ok: false; status: 403; body: { error: 'Forbidden' } }
  | { ok: false; status: 404; body: { error: 'Room not found' } };

export function validateCastRoomAccess(
  rooms: Map<string, CastApiRoomLike>,
  codeRaw: string,
  tokenRaw: string,
): CastRoomAccessResult {
  const code = codeRaw.trim();
  const token = tokenRaw.trim();

  if (!/^\d{4}$/.test(code)) {
    return { ok: false, status: 400, body: { error: 'Invalid room code' } };
  }

  const room = rooms.get(code);
  if (!room) {
    return { ok: false, status: 404, body: { error: 'Room not found' } };
  }

  if (!token || token !== room.castAccessToken) {
    return { ok: false, status: 403, body: { error: 'Forbidden' } };
  }

  return { ok: true, room };
}

export function toCastPublicRoomPayload(room: CastApiRoomLike): CastPublicRoomPayload {
  return {
    roomCode: room.code,
    roomMode: room.mode,
    started: room.state !== null,
    publicState: room.state ? extractPublicState(room.state) : null,
    updatedAtMs: room.lastActivity,
  };
}

export function resolveCastPublicRoom(
  rooms: Map<string, CastApiRoomLike>,
  codeRaw: string,
  tokenRaw: string,
): CastPublicRoomResult {
  const access = validateCastRoomAccess(rooms, codeRaw, tokenRaw);
  if (!access.ok) {
    if (access.status === 400) {
      return { status: 400, body: { error: 'Invalid room code' } };
    }
    if (access.status === 403) {
      return { status: 403, body: { error: 'Forbidden' } };
    }
    return { status: 404, body: { error: 'Room not found' } };
  }

  return {
    status: 200,
    body: toCastPublicRoomPayload(access.room),
  };
}
