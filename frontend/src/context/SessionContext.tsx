import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { SessionState } from '../types';
import { clearSession, loadSession, saveSession } from '../lib/session';

type SessionContextValue = {
  session: SessionState | null;
  setSession: (session: SessionState | null) => void;
  clearCurrentSession: () => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<SessionState | null>(() => loadSession());

  const setSession = useCallback((nextSession: SessionState | null) => {
    setSessionState(nextSession);

    if (nextSession) {
      saveSession(nextSession);
    } else {
      clearSession();
    }
  }, []);

  const clearCurrentSession = useCallback(() => setSession(null), [setSession]);

  return (
    <SessionContext.Provider value={{ session, setSession, clearCurrentSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return context;
}