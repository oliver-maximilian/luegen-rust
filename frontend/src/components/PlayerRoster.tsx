import type { PlayerPublicInfo } from '../types';
import { Pill } from './Ui';

type PlayerRosterProps = {
  currentPlayerName: string;
  currentPlayerId: string;
  players: PlayerPublicInfo[];
  currentTurnPlayerId: string;
};

export function PlayerRoster({
  currentPlayerName,
  currentPlayerId,
  players,
  currentTurnPlayerId,
}: PlayerRosterProps) {
  const turnIsMine = currentTurnPlayerId === currentPlayerId;

  return (
    <div className="roster">
      <article className={`roster__card ${turnIsMine ? 'roster__card--turn' : ''}`.trim()}>
        <div className="roster__meta">
          <Pill tone={turnIsMine ? 'good' : 'neutral'}>{turnIsMine ? 'Du bist dran' : 'Wartest'}</Pill>
          <span className="roster__label">Du</span>
        </div>
        <strong>{currentPlayerName}</strong>
      </article>

      {players.map((player) => {
        const isCurrentTurn = player.id === currentTurnPlayerId;

        return (
          <article key={player.id} className={`roster__card ${isCurrentTurn ? 'roster__card--turn' : ''}`.trim()}>
            <div className="roster__meta">
              <Pill tone={isCurrentTurn ? 'warn' : 'neutral'}>{isCurrentTurn ? 'Am Zug' : 'Am Tisch'}</Pill>
              <span className="roster__label">Spieler</span>
            </div>
            <strong>{player.name}</strong>
          </article>
        );
      })}
    </div>
  );
}