import { MongoClient } from 'mongodb';
import { getAiTelemetryEnabled } from '../ai/telemetry/config.ts';
import type { AIDecisionTelemetryInput, AIGameTelemetryInput } from '../ai/telemetry/types.ts';

interface AIDecisionDocument extends Omit<AIDecisionTelemetryInput, 'createdAt'> {
  _id: string;
  createdAt: Date;
}

interface AIGameDocument extends Omit<AIGameTelemetryInput, 'startedAt' | 'completedAt'> {
  _id: string;
  startedAt: Date;
  completedAt: Date;
  createdAt: Date;
}

let mongoClientPromise: Promise<MongoClient> | null = null;
let mongoIndexesReady = false;

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

function isMongoEnabled(): boolean {
  return Boolean(getMongoUri());
}

function isTelemetryEnabled(): boolean {
  return getAiTelemetryEnabled() && isMongoEnabled();
}

async function getMongoClient(): Promise<MongoClient> {
  if (!mongoClientPromise) {
    const uri = getMongoUri();
    if (!uri) {
      throw new Error('MONGODB_URI is not configured');
    }
    mongoClientPromise = new MongoClient(uri).connect();
  }
  return mongoClientPromise;
}

async function ensureIndexes(): Promise<void> {
  if (!isTelemetryEnabled() || mongoIndexesReady) return;

  const client = await getMongoClient();
  const db = client.db(getMongoDbName());

  const decisions = db.collection<AIDecisionDocument>('ai_decisions');
  await decisions.createIndex({ gameId: 1, turnIndex: 1 }, { unique: true });
  await decisions.createIndex({ createdAt: -1 });
  await decisions.createIndex({ aiDifficulty: 1, aiVersion: 1, createdAt: -1 });

  const games = db.collection<AIGameDocument>('ai_games');
  await games.createIndex({ completedAt: -1 });
  await games.createIndex({ aiDifficulty: 1, aiVersion: 1, completedAt: -1 });

  mongoIndexesReady = true;
}

export async function recordAiDecision(input: AIDecisionTelemetryInput): Promise<void> {
  if (!isTelemetryEnabled()) return;

  await ensureIndexes();
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());

  const document: AIDecisionDocument = {
    _id: `${input.gameId}:${input.turnIndex}`,
    ...input,
    createdAt: new Date(input.createdAt),
  };

  await db.collection<AIDecisionDocument>('ai_decisions').updateOne(
    { _id: document._id },
    { $setOnInsert: document },
    { upsert: true },
  );
}

export async function recordAiGameSummary(input: AIGameTelemetryInput): Promise<void> {
  if (!isTelemetryEnabled()) return;

  await ensureIndexes();
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());

  const document: AIGameDocument = {
    _id: input.gameId,
    ...input,
    startedAt: new Date(input.startedAt),
    completedAt: new Date(input.completedAt),
    createdAt: new Date(),
  };

  await db.collection<AIGameDocument>('ai_games').updateOne(
    { _id: document._id },
    { $setOnInsert: document },
    { upsert: true },
  );
}

export async function closeAiTelemetryStoreClient(): Promise<void> {
  if (!mongoClientPromise) return;

  try {
    const client = await mongoClientPromise;
    await client.close();
  } finally {
    mongoClientPromise = null;
    mongoIndexesReady = false;
  }
}
