declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: {
      framework?: {
        CastContext: {
          getInstance: () => {
            setOptions: (options: {
              receiverApplicationId: string;
              autoJoinPolicy: string;
            }) => void;
            requestSession: () => Promise<void>;
            endCurrentSession: (stopCasting: boolean) => void;
            getCurrentSession: () => {
              getSessionId: () => string;
              getCastDevice: () => { friendlyName: string; deviceId: string };
              sendMessage: (namespace: string, message: string) => Promise<void>;
              addMessageListener: (
                namespace: string,
                listener: (namespace: string, message: string) => void
              ) => void;
              removeMessageListener: (
                namespace: string,
                listener: (namespace: string, message: string) => void
              ) => void;
            } | null;
            addEventListener: (eventType: string, listener: (event: unknown) => void) => void;
            removeEventListener: (eventType: string, listener: (event: unknown) => void) => void;
          };
        };
        CastContextEventType: {
          SESSION_STATE_CHANGED: string;
        };
      };
    };
    chrome?: {
      cast?: {
        AutoJoinPolicy: {
          ORIGIN_SCOPED: string;
        };
        SessionState: Record<string, string>;
      };
    };
  }
}

export {};
