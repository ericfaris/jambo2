import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { getCastSessionController, isCastSdkEnabled } from '../../cast/factory.ts';
import type { CastSessionSummary } from '../../cast/contracts.ts';

interface CastSessionControlProps {
  buttonClassName?: string;
  buttonStyle?: CSSProperties;
  statusClassName?: string;
  statusStyle?: CSSProperties;
  errorClassName?: string;
  errorStyle?: CSSProperties;
  containerStyle?: CSSProperties;
  showStatus?: boolean;
  showError?: boolean;
}

export function CastSessionControl({
  buttonClassName,
  buttonStyle,
  statusClassName,
  statusStyle,
  errorClassName,
  errorStyle,
  containerStyle,
  showStatus = true,
  showError = true,
}: CastSessionControlProps) {
  const castEnabled = isCastSdkEnabled();
  const [castSession, setCastSession] = useState<CastSessionSummary | null>(null);
  const [castError, setCastError] = useState<string | null>(null);

  useEffect(() => {
    if (!castEnabled) return;
    const controller = getCastSessionController();
    setCastSession(controller.getSession());
    const unsubscribe = controller.onSessionChanged((session) => {
      setCastSession(session);
      setCastError(null);
    });
    return unsubscribe;
  }, [castEnabled]);

  const handleCastAction = useCallback(async () => {
    const controller = getCastSessionController();
    try {
      if (castSession) {
        await controller.endSession();
        setCastSession(null);
      } else {
        const session = await controller.requestSession();
        setCastSession(session);
      }
      setCastError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cast session failed';
      setCastError(message);
    }
  }, [castSession]);

  if (!castEnabled) {
    return null;
  }

  const castStatus = castSession
    ? `Casting to ${castSession.device?.friendlyName ?? 'device'}`
    : 'Not casting';

  return (
    <div style={containerStyle}>
      <button
        className={buttonClassName}
        style={buttonStyle}
        onClick={() => void handleCastAction()}
      >
        {castSession ? 'Stop Casting' : 'Cast'}
      </button>
      {showStatus && (
        <div className={statusClassName} style={statusStyle}>
          Cast: {castStatus}
        </div>
      )}
      {showError && castError && (
        <div className={errorClassName} style={errorStyle}>
          {castError}
        </div>
      )}
    </div>
  );
}
