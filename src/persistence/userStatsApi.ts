import { getLocalProfileId } from './localProfile.ts';

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

interface StatsSummaryResponse {
  summary: UserStatsSummary;
}

export interface DifficultyBreakdown {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  gamesPlayed: number;
  aiWins: number;
  humanWins: number;
  aiWinRate: number;
  level: number;
}

interface DifficultyBreakdownResponse {
  breakdown: DifficultyBreakdown[];
}

export async function fetchDifficultyBreakdown(): Promise<DifficultyBreakdown[]> {
  const localProfileId = getLocalProfileId();
  const url = new URL('/api/stats/difficulty', window.location.origin);
  url.searchParams.set('localProfileId', localProfileId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch difficulty breakdown');
  }

  const data = (await response.json()) as DifficultyBreakdownResponse;
  return data.breakdown;
}

interface RecordCompletedGamePayload {
  aiDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
  winner: 0 | 1;
  playerGold: number;
  opponentGold: number;
  turnCount: number;
  rngSeed: number;
  completedAt: number;
  actions?: unknown[];
}

interface RecordCompletedGameResponse {
  ok: boolean;
  summary: UserStatsSummary;
}

export async function fetchUserStatsSummary(): Promise<UserStatsSummary> {
  const localProfileId = getLocalProfileId();
  const url = new URL('/api/stats/summary', window.location.origin);
  url.searchParams.set('localProfileId', localProfileId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stats summary');
  }

  const data = (await response.json()) as StatsSummaryResponse;
  return data.summary;
}

export async function recordCompletedGame(payload: RecordCompletedGamePayload): Promise<UserStatsSummary> {
  const localProfileId = getLocalProfileId();

  const response = await fetch('/api/stats/game', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      localProfileId,
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to record completed game');
  }

  const data = (await response.json()) as RecordCompletedGameResponse;
  return data.summary;
}
