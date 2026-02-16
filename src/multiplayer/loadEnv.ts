import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function parseDotEnv(content: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!key) continue;

    parsed[key] = value;
  }

  return parsed;
}

export function loadLocalEnv(): void {
  const candidates = ['.env', '.env.local'];

  for (const candidate of candidates) {
    const fullPath = resolve(process.cwd(), candidate);
    if (!existsSync(fullPath)) continue;

    const content = readFileSync(fullPath, 'utf8');
    const parsed = parseDotEnv(content);
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}
