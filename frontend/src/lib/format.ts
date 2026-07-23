import type { Card, GameStatus, Rank } from '../types';
import { RANK_LABELS, SUIT_LABELS, SUIT_SYMBOLS } from '../types';

export function formatRank(rank: Rank) {
  return RANK_LABELS[rank];
}

export function formatSuit(suit: Card['suit']) {
  return `${SUIT_LABELS[suit]} ${SUIT_SYMBOLS[suit]}`;
}

export function formatCard(card: Card) {
  return `${formatRank(card.rank)} ${SUIT_SYMBOLS[card.suit]}`;
}

export function formatGameStatus(status: GameStatus) {
  if (typeof status === 'string') {
    if (status === 'WaitingForPlayers') {
      return 'Warte auf Mitspieler';
    }

    if (status === 'InProgress') {
      return 'Läuft';
    }

    return 'Angehalten'; // Stopped
  }

  if ('Finished' in status) {
    return 'Beendet';
  }

  if ('LostByAces' in status) {
    return 'Verloren durch Asse';
  }

  return 'Unbekannt';
}

export function describeGameEnd(status: GameStatus, playerId?: string) {
  if (typeof status === 'string') {
    return status === 'Stopped' ? 'Das Spiel wurde vom Host beendet.' : 'Das Spiel ist beendet.';
  }

  if ('Finished' in status) {
    return playerId && status.Finished.loser_id === playerId
      ? 'Du hast die letzte Runde verloren und das Spiel ist damit beendet.'
      : 'Ein Spieler hat das Spiel verloren und die Partie ist damit beendet.';
  }

  if ('LostByAces' in status) {
    return playerId && status.LostByAces.loser_id === playerId
      ? 'Du hast vier Asse gesammelt und dadurch verloren.'
      : 'Ein Spieler hat vier Asse gesammelt und dadurch verloren.';
  }

  return 'Das Spiel ist beendet.';
}

export function getLoserId(status: GameStatus) {
  if (typeof status === 'string') {
    return null;
  }

  if ('Finished' in status) {
    return status.Finished.loser_id;
  }

  if ('LostByAces' in status) {
    return status.LostByAces.loser_id;
  }

  return null;
}

export function isActiveStatus(status: GameStatus) {
  return status === 'WaitingForPlayers' || status === 'InProgress';
}