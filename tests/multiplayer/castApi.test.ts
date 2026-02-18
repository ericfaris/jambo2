import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/engine/GameState.ts';
import { resolveCastPublicRoom, type CastApiRoomLike } from '../../src/multiplayer/castApi.ts';

function buildRooms(): Map<string, CastApiRoomLike> {
  const room: CastApiRoomLike = {
    code: '1234',
    castAccessToken: 'token-abc-123',
    mode: 'ai',
    state: createInitialState(),
    lastActivity: 1700000000000,
  };
  return new Map([[room.code, room]]);
}

describe('resolveCastPublicRoom', () => {
  it('rejects invalid room code format', () => {
    const result = resolveCastPublicRoom(buildRooms(), '12a4', 'token-abc-123');
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error: 'Invalid room code' });
  });

  it('returns not found for missing room', () => {
    const result = resolveCastPublicRoom(buildRooms(), '9999', 'token-abc-123');
    expect(result.status).toBe(404);
    expect(result.body).toEqual({ error: 'Room not found' });
  });

  it('returns forbidden when token is missing or wrong', () => {
    const missing = resolveCastPublicRoom(buildRooms(), '1234', '');
    const wrong = resolveCastPublicRoom(buildRooms(), '1234', 'wrong-token');
    expect(missing.status).toBe(403);
    expect(wrong.status).toBe(403);
    expect(missing.body).toEqual({ error: 'Forbidden' });
    expect(wrong.body).toEqual({ error: 'Forbidden' });
  });

  it('returns public state payload for valid token', () => {
    const result = resolveCastPublicRoom(buildRooms(), '1234', 'token-abc-123');
    expect(result.status).toBe(200);
    if (result.status !== 200) {
      throw new Error('Expected success response');
    }
    expect(result.body.roomCode).toBe('1234');
    expect(result.body.roomMode).toBe('ai');
    expect(result.body.started).toBe(true);
    expect(result.body.publicState).not.toBeNull();
    expect(result.body.publicState?.players[0].handCount).toBeGreaterThanOrEqual(0);
    expect((result.body.publicState?.players[0] as unknown as { hand?: unknown }).hand).toBeUndefined();
  });
});
