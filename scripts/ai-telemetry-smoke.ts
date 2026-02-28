/// <reference types="node" />

import { MongoClient } from 'mongodb';
import { loadLocalEnv } from '../src/multiplayer/loadEnv.ts';
import {
  closeAiTelemetryStoreClient,
  recordAiDecision,
  recordAiGameSummary,
} from '../src/multiplayer/aiTelemetryStore.ts';
import type { AIDecisionTelemetryInput, AIGameTelemetryInput } from '../src/ai/telemetry/types.ts';

function getMongoUri(): string {
  return process.env['MONGODB_URI'] ?? '';
}

function getMongoDbName(): string {
  const explicit = process.env['MONGODB_DB'];
  if (explicit) return explicit;

  const uri = getMongoUri();
  if (!uri) return 'jambo';

  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname.replace(/^\//, '').trim();
    return dbName || 'jambo';
  } catch {
    return 'jambo';
  }
}

async function main(): Promise<void> {
  loadLocalEnv();

  if (!getMongoUri()) {
    throw new Error('MONGODB_URI is required for telemetry smoke test');
  }

  // Smoke test should always exercise telemetry write path.
  process.env['AI_TELEMETRY_ENABLED'] = 'true';

  const now = Date.now();
  const gameId = `telemetry-smoke-${now.toString(36)}`;
  const roomCode = '9999';
  const schemaVersion = 1;
  const aiVersion = process.env['AI_VERSION'] ?? process.env['npm_package_version'] ?? 'dev';
  const engineVersion = process.env['ENGINE_VERSION'] ?? process.env['npm_package_version'] ?? 'dev';

  const decision: AIDecisionTelemetryInput = {
    gameId,
    roomCode,
    aiDifficulty: 'hard',
    aiPlayerSlot: 1,
    turnIndex: 0,
    features: {
      turn: 3,
      responder: 1,
      phase: 'PLAY',
      actionsLeft: 2,
      pendingType: null,
      hasGuardWindow: false,
      hasRainMakerWindow: false,
      myGold: 34,
      oppGold: 29,
      goldDiff: 5,
      myHandCount: 5,
      oppHandCount: 4,
      handDiff: 1,
      myMarketFilled: 3,
      oppMarketFilled: 4,
      marketDiff: -1,
      myUtilityCount: 2,
      oppUtilityCount: 1,
      utilityDiff: 1,
    },
    candidates: [
      { action: { type: 'PLAY_CARD', cardId: 'cheetah_1' } },
      { action: { type: 'END_TURN' } },
    ],
    chosen: { type: 'PLAY_CARD', cardId: 'cheetah_1' },
    schemaVersion,
    aiVersion,
    engineVersion,
    createdAt: now,
  };

  const game: AIGameTelemetryInput = {
    gameId,
    roomCode,
    aiDifficulty: 'hard',
    aiPlayerSlot: 1,
    winner: 1,
    aiGold: 63,
    opponentGold: 58,
    turnCount: 41,
    rngSeed: 12345,
    schemaVersion,
    aiVersion,
    engineVersion,
    startedAt: now - 120_000,
    completedAt: now,
  };

  await recordAiDecision(decision);
  await recordAiGameSummary(game);

  const client = await new MongoClient(getMongoUri()).connect();
  try {
    const db = client.db(getMongoDbName());
    const decisionDoc = await db.collection('ai_decisions').findOne({ _id: `${gameId}:0` });
    const gameDoc = await db.collection('ai_games').findOne({ _id: gameId });

    if (!decisionDoc || !gameDoc) {
      throw new Error('Telemetry smoke failed: inserted docs not found');
    }

    console.log(`[OK] ai_decisions found: ${decisionDoc._id as string}`);
    console.log(`[OK] ai_games found: ${gameDoc._id as string}`);
  } finally {
    const shouldCleanup = process.argv[2] !== '--keep';
    if (shouldCleanup) {
      const db = client.db(getMongoDbName());
      await db.collection('ai_decisions').deleteOne({ _id: `${gameId}:0` });
      await db.collection('ai_games').deleteOne({ _id: gameId });
      console.log('[OK] Cleanup complete');
    } else {
      console.log('[INFO] Keeping inserted docs (--keep)');
    }
    await client.close();
    await closeAiTelemetryStoreClient();
  }
}

main().catch((error: unknown) => {
  console.error(`[ERROR] ${(error as Error).message}`);
  process.exitCode = 1;
});
