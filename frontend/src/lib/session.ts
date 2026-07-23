import type { SessionState } from '../types';

const SESSION_KEY = 'luegen-rust.session';

export function loadSession(): SessionState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export function saveSession(session: SessionState) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}