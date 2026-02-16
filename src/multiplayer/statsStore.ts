import { MongoClient } from 'mongodb';

export interface GameResultInput {
  localProfileId: string;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  winner: 0 | 1;
  playerGold: number;
  opponentGold: number;
  turnCount: number;
  rngSeed: number;
  completedAt: number;
}

export interface UserStatsSummary {
  localProfileId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  averagePlayerGold: number;
  bestPlayerGold: number;
  averageTurns: number;
  lastPlayedAt: number | null;
}

interface GameResultDocument {
  localProfileId: string;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  winner: 0 | 1;
  playerGold: number;
  opponentGold: number;
  turnCount: number;
  rngSeed: number;
  completedAt: Date;
  createdAt: Date;
}

const memoryResults = new Map<string, GameResultInput[]>();

let mongoClientPromise: Promise<MongoClient> | null = null;
let mongoIndexesReady = false;

function getMongoUri(): string {
  return process.env['MONGODB_URI'] ?? '';
}

function getMongoDbName(): string {
  const explicit = process.env['MONGODB_DB'];
  if (explicit) {
    return explicit;
  }

  const uri = getMongoUri();
  if (!uri) {
    return 'jambo';
  }

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
  if (!isMongoEnabled() || mongoIndexesReady) {
    return;
  }

  const client = await getMongoClient();
  const db = client.db(getMongoDbName());
  const collection = db.collection<GameResultDocument>('game_results');

  await collection.createIndex({ localProfileId: 1, completedAt: -1 });
  await collection.createIndex({ localProfileId: 1, completedAt: 1 }, { unique: true });

  mongoIndexesReady = true;
}

function sanitizeSummary(localProfileId: string, results: readonly GameResultInput[]): UserStatsSummary {
  if (results.length === 0) {
    return {
      localProfileId,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averagePlayerGold: 0,
      bestPlayerGold: 0,
      averageTurns: 0,
      lastPlayedAt: null,
    };
  }

  const gamesPlayed = results.length;
  const wins = results.filter((result) => result.winner === 0).length;
  const losses = gamesPlayed - wins;
  const totalGold = results.reduce((sum, result) => sum + result.playerGold, 0);
  const totalTurns = results.reduce((sum, result) => sum + result.turnCount, 0);
  const bestPlayerGold = results.reduce((max, result) => Math.max(max, result.playerGold), 0);
  const lastPlayedAt = results.reduce((latest, result) => Math.max(latest, result.completedAt), 0);

  return {
    localProfileId,
    gamesPlayed,
    wins,
    losses,
    winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0,
    averagePlayerGold: totalGold / gamesPlayed,
    bestPlayerGold,
    averageTurns: totalTurns / gamesPlayed,
    lastPlayedAt,
  };
}

export async function recordCompletedGame(result: GameResultInput): Promise<void> {
  if (!isMongoEnabled()) {
    const existing = memoryResults.get(result.localProfileId) ?? [];
    if (existing.some((entry) => entry.completedAt === result.completedAt)) {
      return;
    }
    memoryResults.set(result.localProfileId, [...existing, result]);
    return;
  }

  await ensureIndexes();
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());
  const collection = db.collection<GameResultDocument>('game_results');

  await collection.updateOne(
    { localProfileId: result.localProfileId, completedAt: new Date(result.completedAt) },
    {
      $setOnInsert: {
        localProfileId: result.localProfileId,
        aiDifficulty: result.aiDifficulty,
        winner: result.winner,
        playerGold: result.playerGold,
        opponentGold: result.opponentGold,
        turnCount: result.turnCount,
        rngSeed: result.rngSeed,
        completedAt: new Date(result.completedAt),
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

export async function getStatsSummary(localProfileId: string): Promise<UserStatsSummary> {
  if (!isMongoEnabled()) {
    const results = memoryResults.get(localProfileId) ?? [];
    return sanitizeSummary(localProfileId, results);
  }

  await ensureIndexes();
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());
  const collection = db.collection<GameResultDocument>('game_results');

  const results = await collection.find({ localProfileId }).toArray();
  const normalized: GameResultInput[] = results.map((entry) => ({
    localProfileId: entry.localProfileId,
    aiDifficulty: entry.aiDifficulty,
    winner: entry.winner,
    playerGold: entry.playerGold,
    opponentGold: entry.opponentGold,
    turnCount: entry.turnCount,
    rngSeed: entry.rngSeed,
    completedAt: entry.completedAt.getTime(),
  }));

  return sanitizeSummary(localProfileId, normalized);
}
