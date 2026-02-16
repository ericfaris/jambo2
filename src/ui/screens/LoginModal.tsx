import { useEffect, useMemo, useState } from 'react';
import { ResolveMegaView } from '../ResolveMegaView.tsx';
import { getLocalProfileId } from '../../persistence/localProfile.ts';

interface LoginModalProps {
  onClose: () => void;
}

interface AuthSessionResponse {
  authenticated: boolean;
  user?: {
    googleSub: string;
    email: string;
    name: string;
    picture: string;
    localProfileId: string | null;
  };
}

export function LoginModal({ onClose }: LoginModalProps) {
  const [session, setSession] = useState<AuthSessionResponse | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string | null>(null);

  const localProfileId = useMemo(() => getLocalProfileId(), []);

  const refreshSession = async () => {
    setLoadingSession(true);
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load auth session');
      }

      const data = (await response.json()) as AuthSessionResponse;
      setSession(data);
      setError(null);
    } catch {
      setError('Could not load session status. Check server connection.');
      setSession(null);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    void refreshSession();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const auth = url.searchParams.get('auth');
    if (!auth) return;

    if (auth === 'success') {
      setAuthStatus('Google sign-in complete.');
      void refreshSession();
    } else if (auth === 'failed') {
      setAuthStatus('Google sign-in failed. Please try again.');
    } else if (auth === 'state_expired') {
      setAuthStatus('Sign-in session expired. Please retry.');
    } else {
      setAuthStatus('Sign-in was canceled or invalid.');
    }

    url.searchParams.delete('auth');
    window.history.replaceState({}, '', url.toString());
  }, []);

  const startGoogleAuth = () => {
    const returnTo = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
    const startUrl = new URL('/api/auth/google/start', window.location.origin);
    startUrl.searchParams.set('localProfileId', localProfileId);
    startUrl.searchParams.set('returnTo', returnTo);
    window.location.href = startUrl.toString();
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      await refreshSession();
      setAuthStatus('Signed out.');
      setError(null);
    } catch {
      setError('Sign out failed. Please try again.');
    }
  };

  return (
    <ResolveMegaView verticalAlign="center">
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(560px, 96vw)',
          borderRadius: 14,
          padding: 16,
          backgroundImage: [
            'linear-gradient(0deg, rgba(180,170,155,0.08) 0.3px, transparent 0.3px)',
            'linear-gradient(90deg, rgba(180,170,155,0.08) 0.3px, transparent 0.3px)',
            'linear-gradient(135deg, rgba(200,190,175,0.04) 0.3px, transparent 0.3px)',
            'linear-gradient(45deg, rgba(200,190,175,0.04) 0.3px, transparent 0.3px)',
          ].join(', '),
          backgroundSize: '1px 1px, 1px 1px, 1.5px 1.5px, 1.5px 1.5px',
          backgroundColor: 'var(--surface)',
          border: '2px solid var(--border-light)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          color: 'var(--text)',
        }}
      >
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>Login</div>
        <div style={{ fontSize: 15, lineHeight: 1.4, color: 'var(--text-muted)' }}>
          Sign in with Google to link your local Jambo profile and keep your multiplayer identity consistent.
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Local profile: <strong>{localProfileId}</strong>
        </div>

        {loadingSession && (
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Checking sign-in status…</div>
        )}

        {!loadingSession && session?.authenticated && session.user && (
          <div style={{
            padding: 10,
            border: '1px solid var(--border-light)',
            borderRadius: 10,
            background: 'rgba(232,220,200,0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Signed in as {session.user.name}</div>
            <div style={{ fontSize: 13 }}>{session.user.email}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Linked profile: {session.user.localProfileId ?? 'none'}
            </div>
          </div>
        )}

        {authStatus && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{authStatus}</div>
        )}

        {error && (
          <div style={{ fontSize: 13, color: 'var(--accent-red)' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          {!loadingSession && session?.authenticated && (
            <button
              onClick={logout}
              style={{
                background: 'var(--surface-light)',
                borderColor: 'var(--border-light)',
              }}
            >
              Sign out
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface-light)',
              borderColor: 'var(--border-light)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={startGoogleAuth}
            style={{
              background: 'var(--teal)',
              borderColor: 'var(--teal-hover)',
              color: 'var(--text)',
              fontWeight: 700,
            }}
          >
            {!loadingSession && session?.authenticated ? 'Re-link with Google' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </ResolveMegaView>
  );
}
