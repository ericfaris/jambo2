import { createHash, randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createSession, deleteSession, getLinkedProfileId, getSession, upsertLinkedProfileId } from './authStore.ts';

interface OAuthFlowState {
  codeVerifier: string;
  localProfileId: string | null;
  returnTo: string;
  createdAt: number;
}

interface GoogleTokenResponse {
  id_token?: string;
}

interface GoogleTokenInfoResponse {
  aud?: string;
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}

const oauthStates = new Map<string, OAuthFlowState>();

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = 'jambo_session';

function getGoogleOAuthConfig() {
  return {
    clientId: process.env['GOOGLE_CLIENT_ID'] ?? '',
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
    redirectUri: process.env['GOOGLE_REDIRECT_URI'] ?? 'http://localhost:5173/api/auth/google/callback',
    appBaseUrl: process.env['APP_BASE_URL'] ?? 'http://localhost:5173',
  };
}

function cleanupExpiredOAuthStates(): void {
  const now = Date.now();
  for (const [state, value] of oauthStates.entries()) {
    if (now - value.createdAt > OAUTH_STATE_TTL_MS) {
      oauthStates.delete(state);
    }
  }
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createCodeVerifier(): string {
  return base64UrlEncode(randomBytes(64));
}

function createCodeChallenge(codeVerifier: string): string {
  const digest = createHash('sha256').update(codeVerifier).digest();
  return base64UrlEncode(digest);
}

function sanitizeLocalProfileId(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 128) return null;
  return /^[a-zA-Z0-9._-]+$/.test(trimmed) ? trimmed : null;
}

function sanitizeReturnTo(value: string | null, appBaseUrl: string): string {
  try {
    const base = new URL(appBaseUrl);
    const resolved = new URL(value ?? '/', base);
    if (resolved.origin !== base.origin) {
      return base.toString();
    }
    return resolved.toString();
  } catch {
    return appBaseUrl;
  }
}

function appendQuery(urlString: string, key: string, value: string): string {
  const url = new URL(urlString);
  url.searchParams.set(key, value);
  return url.toString();
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(payload);
}

function redirect(res: ServerResponse, location: string): void {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.end();
}

function parseCookies(req: IncomingMessage): Record<string, string> {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return {};
  const parsed: Record<string, string> = {};
  for (const part of rawCookie.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (!key) continue;
    parsed[key] = decodeURIComponent(rest.join('='));
  }
  return parsed;
}

function isSecureRequest(req: IncomingMessage): boolean {
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (typeof forwardedProto === 'string' && forwardedProto.toLowerCase() === 'https') {
    return true;
  }

  const socket = req.socket as { encrypted?: boolean };
  return Boolean(socket.encrypted);
}

function setSessionCookie(req: IncomingMessage, res: ServerResponse, sessionId: string): void {
  const secure = isSecureRequest(req);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (secure) {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(req: IncomingMessage, res: ServerResponse): void {
  const secure = isSecureRequest(req);
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (secure) {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

async function exchangeCodeForIdToken(code: string, codeVerifier: string): Promise<string> {
  const config = getGoogleOAuthConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code_verifier: codeVerifier,
  });

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange OAuth code for token');
  }

  const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenData.id_token) {
    throw new Error('Google token response missing id_token');
  }

  return tokenData.id_token;
}

async function getGoogleUserFromIdToken(idToken: string): Promise<GoogleTokenInfoResponse> {
  const url = new URL('https://oauth2.googleapis.com/tokeninfo');
  url.searchParams.set('id_token', idToken);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to validate id_token with Google');
  }
  return (await response.json()) as GoogleTokenInfoResponse;
}

async function getSessionFromRequest(req: IncomingMessage) {
  const cookies = parseCookies(req);
  const sessionId = cookies[COOKIE_NAME];
  if (!sessionId) return null;
  return getSession(sessionId);
}

export async function handleAuthApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const method = req.method ?? 'GET';
  const host = req.headers.host ?? 'localhost:3001';
  const requestUrl = new URL(req.url ?? '/', `http://${host}`);

  cleanupExpiredOAuthStates();

  if (method === 'GET' && requestUrl.pathname === '/api/auth/google/start') {
    const config = getGoogleOAuthConfig();
    if (!config.clientId || !config.clientSecret) {
      sendJson(res, 500, {
        error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      });
      return true;
    }

    const state = base64UrlEncode(randomBytes(24));
    const codeVerifier = createCodeVerifier();
    const codeChallenge = createCodeChallenge(codeVerifier);
    const localProfileId = sanitizeLocalProfileId(requestUrl.searchParams.get('localProfileId'));
    const returnTo = sanitizeReturnTo(requestUrl.searchParams.get('returnTo'), config.appBaseUrl);

    oauthStates.set(state, {
      codeVerifier,
      localProfileId,
      returnTo,
      createdAt: Date.now(),
    });

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    redirect(res, authUrl.toString());
    return true;
  }

  if (method === 'GET' && requestUrl.pathname === '/api/auth/google/callback') {
    const config = getGoogleOAuthConfig();
    const authError = requestUrl.searchParams.get('error');
    const code = requestUrl.searchParams.get('code');
    const state = requestUrl.searchParams.get('state');

    if (authError) {
      const fallback = sanitizeReturnTo('/', config.appBaseUrl);
      redirect(res, appendQuery(fallback, 'auth', 'error'));
      return true;
    }

    if (!code || !state) {
      const fallback = sanitizeReturnTo('/', config.appBaseUrl);
      redirect(res, appendQuery(fallback, 'auth', 'invalid_callback'));
      return true;
    }

    const flowState = oauthStates.get(state);
    oauthStates.delete(state);
    if (!flowState) {
      const fallback = sanitizeReturnTo('/', config.appBaseUrl);
      redirect(res, appendQuery(fallback, 'auth', 'state_expired'));
      return true;
    }

    try {
      const idToken = await exchangeCodeForIdToken(code, flowState.codeVerifier);
      const tokenInfo = await getGoogleUserFromIdToken(idToken);

      if (tokenInfo.aud !== config.clientId || !tokenInfo.sub || !tokenInfo.email || !tokenInfo.name) {
        throw new Error('Invalid token audience or required claim missing');
      }

      const linkedProfileId = await getLinkedProfileId(tokenInfo.sub)
        ?? flowState.localProfileId
        ?? null;

      if (linkedProfileId) {
        await upsertLinkedProfileId(tokenInfo.sub, linkedProfileId);
      }

      const sessionId = base64UrlEncode(randomBytes(24));
      await createSession({
        id: sessionId,
        user: {
          googleSub: tokenInfo.sub,
          email: tokenInfo.email,
          name: tokenInfo.name,
          picture: tokenInfo.picture ?? '',
          localProfileId: linkedProfileId,
        },
        expiresAt: Date.now() + SESSION_TTL_MS,
      });
      setSessionCookie(req, res, sessionId);

      redirect(res, appendQuery(flowState.returnTo, 'auth', 'success'));
      return true;
    } catch {
      redirect(res, appendQuery(flowState.returnTo, 'auth', 'failed'));
      return true;
    }
  }

  if (method === 'GET' && requestUrl.pathname === '/api/auth/session') {
    const session = await getSessionFromRequest(req);
    if (!session) {
      sendJson(res, 200, { authenticated: false });
      return true;
    }
    sendJson(res, 200, {
      authenticated: true,
      user: session.user,
      expiresAt: session.expiresAt,
    });
    return true;
  }

  if ((method === 'POST' || method === 'GET') && requestUrl.pathname === '/api/auth/logout') {
    const session = await getSessionFromRequest(req);
    if (session) {
      await deleteSession(session.id);
    }
    clearSessionCookie(req, res);
    sendJson(res, 200, { ok: true });
    return true;
  }

  return false;
}
