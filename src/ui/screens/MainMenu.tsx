import { useCallback, useEffect, useState } from 'react';
import './MainMenu.css';
import type { AIDifficulty } from '../../ai/difficulties/index.ts';
import { fetchUserStatsSummary } from '../../persistence/userStatsApi.ts';
import type { UserStatsSummary } from '../../persistence/userStatsApi.ts';

interface MainMenuProps {
  onSelectOption: (option: 'login' | 'solo' | 'multiplayer' | 'settings') => void;
  aiDifficulty: AIDifficulty;
  onChangeAiDifficulty: (difficulty: AIDifficulty) => void;
}

interface AuthSessionResponse {
  authenticated: boolean;
  user?: {
    name: string;
    email: string;
  };
}

export function MainMenu({ onSelectOption, aiDifficulty, onChangeAiDifficulty }: MainMenuProps) {
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
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <div className="image-container">
        <img
          src="/assets/menu/main_menu.png"
          alt="Jambo Main Menu"
        />
        <div className="overlay-text">
          <div style={{ color: '#f4e7c3', fontSize: 15, marginBottom: 4, fontWeight: 600 }}>
            Welcome, {welcomeName}
          </div>
          {statsSummary && (
            <div style={{ color: '#f4e7c3', fontSize: 12, marginBottom: 6 }}>
              Record: {statsSummary.wins}-{statsSummary.losses} ({Math.round(statsSummary.winRate * 100)}%)
            </div>
          )}
          <button onClick={() => onSelectOption('solo')}>Play Solo</button>
          <button onClick={() => onSelectOption('multiplayer')}>Multiplayer</button>
          <button onClick={() => onSelectOption('settings')}>Settings</button>
          <button onClick={() => void handleAuthAction()} disabled={isAuthLoading}>
            {isAuthLoading ? 'Checking Profile...' : session?.authenticated ? 'Logout' : 'Login'}
          </button>
          {authError && (
            <div style={{ color: '#f4e7c3', fontSize: 12, maxWidth: 220 }}>
              {authError}
            </div>
          )}
          {statsError && (
            <div style={{ color: '#f4e7c3', fontSize: 12, maxWidth: 220 }}>
              {statsError}
            </div>
          )}
          <label style={{ marginTop: 8, color: '#f4e7c3', fontSize: 14 }}>
            AI Difficulty
            <select
              value={aiDifficulty}
              onChange={(event) => onChangeAiDifficulty(event.target.value as AIDifficulty)}
              style={{ marginLeft: 8 }}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}