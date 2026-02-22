function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') return true;
  if (normalized === '0' || normalized === 'false' || normalized === 'no') return false;
  return fallback;
}

export function getAiTelemetryEnabled(): boolean {
  return parseBoolean(process.env['AI_TELEMETRY_ENABLED'], false);
}

export function getAiTelemetrySampleRate(): number {
  const raw = process.env['AI_TELEMETRY_SAMPLE_RATE'];
  if (!raw) return 0.2;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0.2;
  return Math.min(1, Math.max(0, parsed));
}

export function shouldSampleTelemetryGame(sampleRate: number, rng: () => number = Math.random): boolean {
  if (sampleRate <= 0) return false;
  if (sampleRate >= 1) return true;
  return rng() < sampleRate;
}

