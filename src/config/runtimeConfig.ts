interface RuntimeConfig {
  castAppId: string | null;
}

const runtimeConfig: RuntimeConfig = {
  castAppId: null,
};

export async function loadRuntimeConfig(): Promise<void> {
  try {
    const response = await fetch('/api/config', {
      method: 'GET',
      credentials: 'same-origin',
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { castAppId?: string | null };
    const castAppId = payload.castAppId?.trim();
    runtimeConfig.castAppId = castAppId && castAppId.length > 0 ? castAppId : null;
  } catch {
    // Ignore runtime config errors; app can still run with build-time fallback.
  }
}

export function getRuntimeCastAppId(): string | null {
  return runtimeConfig.castAppId;
}
