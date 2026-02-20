// ============================================================================
// Audio Settings — localStorage-backed volume & mute helpers
// ============================================================================

const VOLUME_STORAGE_KEY = 'jambo.volume';
const MUTED_STORAGE_KEY = 'jambo.muted';

export function getVolume(): number {
  if (typeof window === 'undefined') return 50;
  const saved = window.localStorage.getItem(VOLUME_STORAGE_KEY);
  if (saved === null) return 50;
  const parsed = parseInt(saved, 10);
  if (isNaN(parsed) || parsed < 0 || parsed > 100) return 50;
  return parsed;
}

export function setVolume(v: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VOLUME_STORAGE_KEY, String(Math.round(Math.max(0, Math.min(100, v)))));
}

export function getMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(MUTED_STORAGE_KEY) === 'true';
}

export function setMuted(m: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MUTED_STORAGE_KEY, String(m));
}

export function getEffectiveVolume(): number {
  if (getMuted()) return 0;
  return getVolume() / 100;
}

export function resetAudioSettings(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(VOLUME_STORAGE_KEY);
  window.localStorage.removeItem(MUTED_STORAGE_KEY);
}
