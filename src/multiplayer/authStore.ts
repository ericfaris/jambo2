import { MongoClient } from 'mongodb';

export interface StoredAuthUser {
  googleSub: string;
  email: string;
  name: string;
  picture: string;
  localProfileId: string | null;
}

export interface StoredAuthSession {
  id: string;
  user: StoredAuthUser;
  expiresAt: number;
}

interface SessionDocument {
  _id: string;
  user: StoredAuthUser;
  expiresAt: Date;
  createdAt: Date;
}

interface GoogleLinkDocument {
  _id: string;
  localProfileId: string;
  updatedAt: Date;
}

const memorySessions = new Map<string, StoredAuthSession>();
const memoryGoogleLinks = new Map<string, string>();

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

  await db.collection<SessionDocument>('oauth_sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection<GoogleLinkDocument>('oauth_google_links').createIndex({ updatedAt: 1 });

  mongoIndexesReady = true;
}

export async function createSession(session: StoredAuthSession): Promise<void> {
  if (!isMongoEnabled()) {
    memorySessions.set(session.id, session);
    return;
  }

  await ensureIndexes();
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());

  await db.collection<SessionDocument>('oauth_sessions').updateOne(
    { _id: session.id },
    {
      $set: {
        user: session.user,
        expiresAt: new Date(session.expiresAt),
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

export async function getSession(sessionId: string): Promise<StoredAuthSession | null> {
  if (!isMongoEnabled()) {
    const session = memorySessions.get(sessionId);
    if (!session || session.expiresAt <= Date.now()) {
      memorySessions.delete(sessionId);
      return null;
    }
    return session;
  }

  await ensureIndexes();
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());

  const session = await db.collection<SessionDocument>('oauth_sessions').findOne({ _id: sessionId });
  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await db.collection<SessionDocument>('oauth_sessions').deleteOne({ _id: sessionId });
    return null;
  }

  return {
    id: session._id,
    user: session.user,
    expiresAt: session.expiresAt.getTime(),
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (!isMongoEnabled()) {
    memorySessions.delete(sessionId);
    return;
  }

  await ensureIndexes();
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());
  await db.collection<SessionDocument>('oauth_sessions').deleteOne({ _id: sessionId });
}

export async function getLinkedProfileId(googleSub: string): Promise<string | null> {
  if (!isMongoEnabled()) {
    return memoryGoogleLinks.get(googleSub) ?? null;
  }

  await ensureIndexes();
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());
  const link = await db.collection<GoogleLinkDocument>('oauth_google_links').findOne({ _id: googleSub });
  return link?.localProfileId ?? null;
}

export async function upsertLinkedProfileId(googleSub: string, localProfileId: string): Promise<void> {
  if (!isMongoEnabled()) {
    memoryGoogleLinks.set(googleSub, localProfileId);
    return;
  }

  await ensureIndexes();
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());

  await db.collection<GoogleLinkDocument>('oauth_google_links').updateOne(
    { _id: googleSub },
    {
      $set: {
        localProfileId,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
}
