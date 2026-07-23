import type { Rank } from '../types';
import { PLAYABLE_RANKS } from '../types';
import { formatRank } from '../lib/format';
import { Pill } from './Ui';

type RankSelectorProps = {
  value: Rank;
  lockedRank?: Rank | null;
  onChange: (rank: Rank) => void;
};

export function RankSelector({ value, lockedRank = null, onChange }: RankSelectorProps) {
  if (lockedRank) {
    return (
      <div className="rank-selector rank-selector--locked">
        <Pill tone="gold">Ansage fest: {formatRank(lockedRank)}</Pill>
      </div>
    );
  }

  return (
    <div className="rank-selector">
      {PLAYABLE_RANKS.map((rank) => (
        <button
          key={rank}
          type="button"
          className={`rank-chip ${value === rank ? 'rank-chip--active' : ''}`.trim()}
          onClick={() => onChange(rank)}
        >
          {formatRank(rank)}
        </button>
      ))}
    </div>
  );
}