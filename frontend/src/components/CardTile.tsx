import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import type { Card } from '../types';
import { formatRank } from '../lib/format';
import { SUIT_SYMBOLS } from '../types';

type CardTileProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  card: Card;
  selected?: boolean;
  disabled?: boolean;
  dragging?: boolean;
  tilt?: number;
  lift?: number;
};

function cardSuitTone(card: Card) {
  return card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : 'black';
}

export function CardTile({
  card,
  selected = false,
  disabled = false,
  dragging = false,
  tilt = 0,
  lift = 0,
  className = '',
  ...props
}: CardTileProps) {
  const style = {
    '--card-tilt': `${tilt}deg`,
    '--card-lift': `${lift}px`,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={`card-tile card-tile--${cardSuitTone(card)} ${selected ? 'card-tile--selected' : ''} ${dragging ? 'card-tile--dragging' : ''} ${className}`.trim()}
      disabled={disabled}
      aria-pressed={selected}
      style={style}
      {...props}
    >
      <span className="card-tile__shine" />
      {selected ? (
        <span className="card-tile__check" aria-hidden="true">
          ✓
        </span>
      ) : null}
      <span className="card-tile__corner card-tile__corner--tl">
        <span className="card-tile__rank">{formatRank(card.rank)}</span>
        <span className="card-tile__suit">{SUIT_SYMBOLS[card.suit]}</span>
      </span>
      <span className="card-tile__pip">{SUIT_SYMBOLS[card.suit]}</span>
      <span className="card-tile__corner card-tile__corner--br">
        <span className="card-tile__rank">{formatRank(card.rank)}</span>
        <span className="card-tile__suit">{SUIT_SYMBOLS[card.suit]}</span>
      </span>
    </button>
  );
}