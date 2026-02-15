/// <reference types="node" />

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { UtilityDesignId } from '../src/engine/types.ts';
import { runAiMatchups } from './ai-matchups.ts';

type BenchmarkMode = 'short' | 'medium' | 'long';

interface BenchmarkConfig {
  games: number;
  seedBase: number;
  maxSteps: number;
  maxGameMs: number;
}

const BENCHMARK_CONFIGS: Record<BenchmarkMode, BenchmarkConfig> = {
  short: {
    games: 20,
    seedBase: 23000,
    maxSteps: 2500,
    maxGameMs: 8000,
  },
  medium: {
    games: 100,
    seedBase: 23000,
    maxSteps: 2500,
    maxGameMs: 8000,
  },
  long: {
    games: 300,
    seedBase: 23000,
    maxSteps: 2500,
    maxGameMs: 8000,
  },
};

const UTILITIES: UtilityDesignId[] = [
  'well',
  'supplies',
  'leopard_statue',
  'boat',
  'weapons',
  'scale',
  'drums',
  'kettle',
  'throne',
  'mask_of_transformation',
];

function parseMode(value: string | undefined): BenchmarkMode {
  if (!value) return 'short';
  if (value === 'short' || value === 'medium' || value === 'long') return value;
  throw new Error(`Invalid mode "${value}". Use short, medium, or long.`);
}

function escapeCsv(value: string | number): string {
  const raw = String(value);
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

function buildCsv(result: ReturnType<typeof runAiMatchups>): string {
  const headers = [
    'label',
    'games',
    'p0Wins',
    'p1Wins',
    'ties',
    'p0WinRate',
    'p1WinRate',
    'avgTurns',
    'avgGoldDelta',
    'stalls',
    ...UTILITIES.map((utility) => `${utility}_act_per_game`),
  ];

  const lines = [headers.join(',')];

  for (const summary of result.summaries) {
    const values: Array<string | number> = [
      summary.label,
      summary.games,
      summary.p0Wins,
      summary.p1Wins,
      summary.ties,
      summary.p0WinRate,
      summary.p1WinRate,
      summary.avgTurns,
      summary.avgGoldDelta,
      summary.stalls,
      ...UTILITIES.map((utility) => (summary.utilityStats.activated[utility] / summary.games).toFixed(2)),
    ];

    lines.push(values.map(escapeCsv).join(','));
  }

  return lines.join('\n');
}

function main(): void {
  const mode = parseMode(process.argv[2]);
  const config = BENCHMARK_CONFIGS[mode];

  const result = runAiMatchups(
    config.games,
    config.seedBase,
    {
      maxSteps: config.maxSteps,
      maxGameMs: config.maxGameMs,
    },
  );

  const outDir = join(process.cwd(), 'reports', 'ai-benchmark');
  mkdirSync(outDir, { recursive: true });

  const jsonPath = join(outDir, `${mode}.json`);
  const csvPath = join(outDir, `${mode}.csv`);

  writeFileSync(jsonPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(csvPath, `${buildCsv(result)}\n`, 'utf8');

  console.log(`Benchmark mode: ${mode}`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`CSV: ${csvPath}`);
}

main();
