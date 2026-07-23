import type {
  Card,
  CreateGameResponse,
  DebugGameResponse,
  JoinGameResponse,
  Rank,
  SessionState,
  WsClientMessage,
  WsServerMessage,
} from '../types';

function buildFormBody(payload: Record<string, string | number>) {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    form.set(key, String(value));
  }
  return form;
}

async function readError(response: Response) {
  const fallback = `${response.status} ${response.statusText}`;

  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    try {
      const text = await response.text();
      return text || fallback;
    } catch {
      return fallback;
    }
  }
}

async function postForm<T>(path: string, payload: Record<string, string | number>, expectsJson = true) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: buildFormBody(payload),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  if (!expectsJson) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function createGame(payload: {
  gameName: string;
  playerName: string;
  maxPlayers: number;
}) {
  return postForm<CreateGameResponse>('/api/game/create', {
    game_name: payload.gameName,
    player_name: payload.playerName,
    max_players: payload.maxPlayers,
  });
}

export async function joinGame(payload: { gameName: string; playerName: string }) {
  return postForm<JoinGameResponse>('/api/game/join', {
    game_name: payload.gameName,
    player_name: payload.playerName,
  });
}

export async function startGame(gameId: string) {
  return postForm<void>('/api/game/start', { game_id: gameId }, false);
}

export async function stopGame(gameId: string, playerId: string) {
  return postForm<void>('/api/game/stop', { game_id: gameId, player_id: playerId }, false);
}

export async function fetchDebugGames() {
  const response = await fetch('/api/debug/game');
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return (await response.json()) as DebugGameResponse;
}

export function createGameSocket(session: SessionState) {
  return new WebSocket(
    `/api/game?game_id=${encodeURIComponent(session.gameId)}&player_id=${encodeURIComponent(session.playerId)}`,
  );
}

export function sendGameAction(socket: WebSocket, message: WsClientMessage) {
  socket.send(JSON.stringify(message));
}

export function sendPlayCards(socket: WebSocket, cards: Card[], claim: Rank) {
  sendGameAction(socket, { action: 'PlayCards', cards, claim });
}

export function sendDoubt(socket: WebSocket) {
  sendGameAction(socket, { action: 'Doubt' });
}

export function parseServerMessage(raw: string) {
  return JSON.parse(raw) as WsServerMessage;
}