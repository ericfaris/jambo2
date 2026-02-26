import { describe, it, expect } from 'vitest';
import { validateRecordRequest, isValidProfileId } from '../../src/multiplayer/statsApi.ts';
import { generateSeed } from '../../src/utils/rng.ts';

// ---------------------------------------------------------------------------
// Helper: a valid payload that passes validation
// ---------------------------------------------------------------------------
function validPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    localProfileId: 'abc-123_test.user',
    aiDifficulty: 'medium',
    winner: 0,
    playerGold: 60,
    opponentGold: 45,
    turnCount: 18,
    rngSeed: 42,
    completedAt: Date.now(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validateRecordRequest
// ---------------------------------------------------------------------------
describe('validateRecordRequest', () => {
  it('accepts a fully valid payload', () => {
    expect(validateRecordRequest(validPayload())).toBe(true);
  });

  it('accepts payload without optional completedAt', () => {
    const p = validPayload();
    delete p.completedAt;
    expect(validateRecordRequest(p)).toBe(true);
  });

  // --- rngSeed edge cases (the original bug) ---

  it('accepts negative rngSeed (signed 32-bit from generateSeed)', () => {
    expect(validateRecordRequest(validPayload({ rngSeed: -1 }))).toBe(true);
    expect(validateRecordRequest(validPayload({ rngSeed: -2147483648 }))).toBe(true); // INT32_MIN
  });

  it('accepts zero rngSeed', () => {
    expect(validateRecordRequest(validPayload({ rngSeed: 0 }))).toBe(true);
  });

  it('accepts large positive rngSeed', () => {
    expect(validateRecordRequest(validPayload({ rngSeed: 2147483647 }))).toBe(true); // INT32_MAX
  });

  it('rejects non-integer rngSeed', () => {
    expect(validateRecordRequest(validPayload({ rngSeed: 1.5 }))).toBe(false);
  });

  it('rejects string rngSeed', () => {
    expect(validateRecordRequest(validPayload({ rngSeed: '42' }))).toBe(false);
  });

  it('accepts seeds produced by generateSeed()', () => {
    // Run many times to catch both positive and negative seeds
    for (let i = 0; i < 100; i++) {
      const seed = generateSeed();
      expect(validateRecordRequest(validPayload({ rngSeed: seed }))).toBe(true);
    }
  });

  // --- localProfileId ---

  it('rejects missing localProfileId', () => {
    const p = validPayload();
    delete p.localProfileId;
    expect(validateRecordRequest(p)).toBe(false);
  });

  it('rejects empty localProfileId', () => {
    expect(validateRecordRequest(validPayload({ localProfileId: '' }))).toBe(false);
  });

  // --- aiDifficulty ---

  it('accepts all valid difficulty levels', () => {
    expect(validateRecordRequest(validPayload({ aiDifficulty: 'easy' }))).toBe(true);
    expect(validateRecordRequest(validPayload({ aiDifficulty: 'medium' }))).toBe(true);
    expect(validateRecordRequest(validPayload({ aiDifficulty: 'hard' }))).toBe(true);
  });

  it('rejects invalid difficulty', () => {
    expect(validateRecordRequest(validPayload({ aiDifficulty: 'extreme' }))).toBe(false);
    expect(validateRecordRequest(validPayload({ aiDifficulty: '' }))).toBe(false);
  });

  // --- winner ---

  it('accepts winner 0 or 1', () => {
    expect(validateRecordRequest(validPayload({ winner: 0 }))).toBe(true);
    expect(validateRecordRequest(validPayload({ winner: 1 }))).toBe(true);
  });

  it('rejects winner values other than 0 or 1', () => {
    expect(validateRecordRequest(validPayload({ winner: 2 }))).toBe(false);
    expect(validateRecordRequest(validPayload({ winner: -1 }))).toBe(false);
    expect(validateRecordRequest(validPayload({ winner: '0' }))).toBe(false);
  });

  // --- gold and turnCount must be non-negative ---

  it('rejects negative playerGold', () => {
    expect(validateRecordRequest(validPayload({ playerGold: -1 }))).toBe(false);
  });

  it('rejects negative opponentGold', () => {
    expect(validateRecordRequest(validPayload({ opponentGold: -1 }))).toBe(false);
  });

  it('rejects negative turnCount', () => {
    expect(validateRecordRequest(validPayload({ turnCount: -1 }))).toBe(false);
  });

  it('rejects fractional gold', () => {
    expect(validateRecordRequest(validPayload({ playerGold: 60.5 }))).toBe(false);
  });

  // --- null / non-object ---

  it('rejects null', () => {
    expect(validateRecordRequest(null)).toBe(false);
  });

  it('rejects a string', () => {
    expect(validateRecordRequest('hello')).toBe(false);
  });

  it('rejects an empty object', () => {
    expect(validateRecordRequest({})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidProfileId
// ---------------------------------------------------------------------------
describe('isValidProfileId', () => {
  it('accepts UUID format (crypto.randomUUID)', () => {
    expect(isValidProfileId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts fallback local_ format', () => {
    expect(isValidProfileId('local_m1abc123_defgh456')).toBe(true);
  });

  it('accepts alphanumeric with dots, underscores, hyphens', () => {
    expect(isValidProfileId('user.name_123-test')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidProfileId('')).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidProfileId(null)).toBe(false);
  });

  it('rejects strings with special characters', () => {
    expect(isValidProfileId('user@domain')).toBe(false);
    expect(isValidProfileId('user name')).toBe(false);
    expect(isValidProfileId('user/path')).toBe(false);
  });

  it('rejects strings over 128 characters', () => {
    expect(isValidProfileId('a'.repeat(129))).toBe(false);
  });

  it('accepts strings up to 128 characters', () => {
    expect(isValidProfileId('a'.repeat(128))).toBe(true);
  });
});
