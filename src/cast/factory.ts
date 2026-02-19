import { NoopCastSessionController, type CastSessionController } from './contracts.ts';
import { WebCastSessionController } from './webSender.ts';
import { getRuntimeCastAppId } from '../config/runtimeConfig.ts';

let singleton: CastSessionController | null = null;

export function isCastSdkEnabled(): boolean {
  const appId = getRuntimeCastAppId() ?? import.meta.env.VITE_CAST_APP_ID?.trim();
  return !!appId;
}

export function getCastSessionController(): CastSessionController {
  if (singleton) return singleton;

  const appId = getRuntimeCastAppId() ?? import.meta.env.VITE_CAST_APP_ID?.trim();
  if (!appId) {
    console.warn('[Cast] Cast app id is missing. Set VITE_CAST_APP_ID in runtime env or build env.');
    singleton = new NoopCastSessionController();
    return singleton;
  }

  singleton = new WebCastSessionController(appId);
  return singleton;
}
