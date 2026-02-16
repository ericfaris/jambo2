import { useCallback, useEffect, useState } from 'react';
import './MainMenu.css';
import { fetchUserStatsSummary } from '../../persistence/userStatsApi.ts';
import type { UserStatsSummary } from '../../persistence/userStatsApi.ts';

interface MainMenuProps {
  onSelectOption: (option: 'login' | 'solo' | 'multiplayer' | 'settings') => void;
  onTutorial?: () => void;
}

interface AuthSessionResponse {
  authenticated: boolean;
  user?: {
    name: string;
    email: string;
  };
}

export function MainMenu({ onSelectOption, onTutorial }: MainMenuProps) {
  const [session, setSession] = useState<AuthSessionResponse | null>(null);
  const [statsSummary, setStatsSummary] = useState<UserStatsSummary | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const summary = await fetchUserStatsSummary();
      setStatsSummary(summary);
      setStatsError(null);
    } catch {
      setStatsError('Stats unavailable');
    }
  }, []);

  const refreshSession = useCallback(async () => {
    setIsAuthLoading(true);
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
      setAuthError(null);
    } catch {
      setSession(null);
      setAuthError('Could not load profile status.');
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
    void refreshStats();
  }, [refreshSession, refreshStats]);

  useEffect(() => {
    const onFocus = () => {
      void refreshSession();
      void refreshStats();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshSession, refreshStats]);

  const handleAuthAction = useCallback(async () => {
    if (session?.authenticated) {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Logout failed');
        }
        await refreshSession();
        await refreshStats();
      } catch {
        setAuthError('Sign out failed. Please try again.');
      }
      return;
    }

    onSelectOption('login');
  }, [onSelectOption, refreshSession, refreshStats, session?.authenticated]);

  const welcomeName = session?.authenticated && session.user?.name
    ? session.user.name
    : 'Trader';

  return (
    <div className="main-menu-root">
      <div className="image-container">
        <img
          src="/assets/menu/main_menu.png"
          alt="Jambo Main Menu"
        />
        <div className="overlay-text etched-wood-border dialog-pop">
          <div className="menu-title">
            Welcome, {welcomeName}
          </div>
          {statsSummary && (
            <div className="menu-subtitle">
              Record: {statsSummary.wins}-{statsSummary.losses} ({Math.round(statsSummary.winRate * 100)}%)
            </div>
          )}
          <button className="menu-action" onClick={() => onSelectOption('solo')}>Play Solo</button>
          <button className="menu-action" onClick={() => onSelectOption('multiplayer')}>Multiplayer</button>
          <button className="menu-action" onClick={() => onSelectOption('settings')}>Settings</button>
          {onTutorial && (
            <button className="menu-action" onClick={onTutorial}>How to Play</button>
          )}
          <button className="menu-action" onClick={() => void handleAuthAction()} disabled={isAuthLoading}>
            {isAuthLoading ? 'Checking Profile...' : session?.authenticated ? 'Logout' : 'Login'}
          </button>
          {authError && (
            <div className="menu-error">
              {authError}
            </div>
          )}
          {statsError && (
            <div className="menu-error">
              {statsError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}