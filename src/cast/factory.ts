import { NoopCastSessionController, type CastSessionController } from './contracts.ts';
import { WebCastSessionController } from './webSender.ts';

let singleton: CastSessionController | null = null;

export function isCastSdkEnabled(): boolean {
  return true;
}

export function getCastSessionController(): CastSessionController {
  if (singleton) return singleton;

  const appId = import.meta.env.VITE_CAST_APP_ID?.trim();
  if (!appId) {
    console.warn('[Cast] VITE_CAST_APP_ID is missing. Falling back to no-op.');
    singleton = new NoopCastSessionController();
    return singleton;
  }

  singleton = new WebCastSessionController(appId);
  return singleton;
}
