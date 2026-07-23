export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';

export type Rank =
  | 'Two'
  | 'Three'
  | 'Four'
  | 'Five'
  | 'Six'
  | 'Seven'
  | 'Eight'
  | 'Nine'
  | 'Ten'
  | 'Jack'
  | 'Queen'
  | 'King'
  | 'Ace';

export type Card = {
  rank: Rank;
  suit: Suit;
};

export type PlayerPublicInfo = {
  id: string;
  name: string;
};

export type GameStatus =
  | 'WaitingForPlayers'
  | 'InProgress'
  | 'Stopped'
  | { Finished: { loser_id: string } }
  | { LostByAces: { loser_id: string } };

export type GameView = {
  player_id: string;
  game_id: string;
  current_player_id: string;
  center_stack_count: number;
  max_players: number;
  current_claim: Rank | null;
  status: GameStatus;
  hand: Card[];
  players: PlayerPublicInfo[];
};

export type WsServerMessage =
  | { event: 'StateUpdate'; gameview: GameView }
  | { event: 'Error'; message: string };

export type WsClientMessage =
  | { action: 'PlayCards'; cards: Card[]; claim: Rank }
  | { action: 'Doubt' };

export type CreateGameResponse = {
  player_id: string;
  game_id: string;
};

export type JoinGameResponse = {
  player_id: string;
  game_id: string;
};

export type DebugGame = {
  id: string;
  name: string;
  status: GameStatus;
  players: Array<{
    id: string;
    name: string;
    cards: Card[];
  }>;
};

export type DebugGameResponse = {
  games: DebugGame[];
};

export type SessionState = {
  gameId: string;
  gameName: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  maxPlayers?: number;
  lastStatus?: GameStatus;
};

export const RANKS: Rank[] = [
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Jack',
  'Queen',
  'King',
  'Ace',
];

export const PLAYABLE_RANKS: Rank[] = RANKS.filter((rank) => rank !== 'Ace');

export const SUIT_SYMBOLS: Record<Suit, string> = {
  Hearts: '♥',
  Diamonds: '♦',
  Clubs: '♣',
  Spades: '♠',
};

export const RANK_LABELS: Record<Rank, string> = {
  Two: '2',
  Three: '3',
  Four: '4',
  Five: '5',
  Six: '6',
  Seven: '7',
  Eight: '8',
  Nine: '9',
  Ten: '10',
  Jack: 'Bube',
  Queen: 'Dame',
  King: 'König',
  Ace: 'Ass',
};

export const SUIT_LABELS: Record<Suit, string> = {
  Hearts: 'Herz',
  Diamonds: 'Karo',
  Clubs: 'Kreuz',
  Spades: 'Pik',
};