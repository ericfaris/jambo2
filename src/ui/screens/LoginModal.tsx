import { useEffect, useMemo, useState } from 'react';
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
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

  const isSignedIn = !loadingSession && session?.authenticated && session.user;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        background: 'rgba(20,10,5,0.90)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="dialog-pop"
        onClick={(event) => event.stopPropagation()}
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          width: 'min(400px, 90vw)',
        }}
      >
        {/* Label */}
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: 'var(--text-muted)',
        }}>
          Account
        </div>

        {/* Title */}
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(28px, 6vw, 44px)',
          color: 'var(--gold)',
          textShadow: '0 2px 12px rgba(0,0,0,0.6)',
        }}>
          {isSignedIn ? 'Signed In' : 'Sign In'}
        </div>

        {/* Gold divider */}
        <div style={{
          width: 60,
          height: 3,
          borderRadius: 2,
          background: 'var(--gold)',
          opacity: 0.5,
        }} />

        {/* Description */}
        <div style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--text-muted)',
          maxWidth: 320,
        }}>
          {isSignedIn
            ? 'Your Google account is linked to your local Jambo profile.'
            : 'Sign in to link your profile and keep your multiplayer identity consistent.'}
        </div>

        {/* Signed-in user info */}
        {isSignedIn && session.user && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              {session.user.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {session.user.email}
            </div>
          </div>
        )}

        {/* Loading */}
        {loadingSession && (
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Checking sign-in status...</div>
        )}

        {/* Status message */}
        {authStatus && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{authStatus}</div>
        )}

        {/* Error */}
        {error && (
          <div style={{ fontSize: 13, color: '#ff9977' }}>{error}</div>
        )}

        {/* Divider before actions */}
        <div style={{
          width: '100%',
          height: 1,
          background: 'var(--border-light)',
          opacity: 0.4,
        }} />

        {/* Actions */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          width: '100%',
        }}>
          {/* Google button */}
          <button
            onClick={startGoogleAuth}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: '2px solid var(--gold)',
              background: 'rgba(212,168,80,0.10)',
              color: 'var(--gold)',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,168,80,0.20)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212,168,80,0.10)'; }}
          >
            <GoogleIcon />
            {isSignedIn ? 'Re-link with Google' : 'Continue with Google'}
          </button>

          {/* Sign out (when signed in) */}
          {isSignedIn && (
            <button
              onClick={logout}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 14,
                transition: 'background 0.15s, border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.color = 'var(--text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              Sign out
            </button>
          )}

          {/* Back */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.color = 'var(--text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
