import { describe, expect, it } from 'vitest';
import { createTestState } from '../helpers/testHelpers.ts';
import { extractAiTurnFeatures } from '../../src/ai/telemetry/extract.ts';
import { getAiTelemetrySampleRate, shouldSampleTelemetryGame } from '../../src/ai/telemetry/config.ts';

describe('AI telemetry helpers', () => {
  it('extracts stable per-turn features for a responder', () => {
    const state = createTestState(777);
    const features = extractAiTurnFeatures(state, 0);

    expect(features.turn).toBe(state.turn);
    expect(features.responder).toBe(0);
    expect(features.phase).toBe(state.phase);
    expect(features.myGold).toBe(state.players[0].gold);
    expect(features.oppGold).toBe(state.players[1].gold);
    expect(features.goldDiff).toBe(state.players[0].gold - state.players[1].gold);
    expect(features.myHandCount).toBe(state.players[0].hand.length);
    expect(features.oppHandCount).toBe(state.players[1].hand.length);
  });

  it('samples deterministically with injected rng', () => {
    expect(shouldSampleTelemetryGame(0, () => 0)).toBe(false);
    expect(shouldSampleTelemetryGame(1, () => 1)).toBe(true);
    expect(shouldSampleTelemetryGame(0.25, () => 0.2)).toBe(true);
    expect(shouldSampleTelemetryGame(0.25, () => 0.3)).toBe(false);
  });

  it('parses and clamps sample rate from env', () => {
    const prev = process.env['AI_TELEMETRY_SAMPLE_RATE'];

    process.env['AI_TELEMETRY_SAMPLE_RATE'] = '0.75';
    expect(getAiTelemetrySampleRate()).toBe(0.75);

    process.env['AI_TELEMETRY_SAMPLE_RATE'] = '-4';
    expect(getAiTelemetrySampleRate()).toBe(0);

    process.env['AI_TELEMETRY_SAMPLE_RATE'] = '4';
    expect(getAiTelemetrySampleRate()).toBe(1);

    process.env['AI_TELEMETRY_SAMPLE_RATE'] = 'NaN';
    expect(getAiTelemetrySampleRate()).toBe(0.2);

    if (prev === undefined) {
      delete process.env['AI_TELEMETRY_SAMPLE_RATE'];
    } else {
      process.env['AI_TELEMETRY_SAMPLE_RATE'] = prev;
    }
  });
});

