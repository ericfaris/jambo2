const LOCAL_PROFILE_STORAGE_KEY = 'jambo.localProfileId';

export function getLocalProfileId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const existing = window.localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY);
  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const generated = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, generated);
  return generated;
}
