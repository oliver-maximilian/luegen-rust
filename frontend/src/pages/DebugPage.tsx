import { useEffect, useState } from 'react';
import { fetchDebugGames } from '../lib/api';
import { formatCard, formatGameStatus } from '../lib/format';
import { Panel, Pill, Button } from '../components/Ui';
import type { DebugGame } from '../types';

export function DebugPage() {
  const [games, setGames] = useState<DebugGame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetchDebugGames();
        if (!mounted) {
          return;
        }
        setGames(response.games);
        setError(null);
      } catch (cause) {
        if (!mounted) {
          return;
        }
        setError(cause instanceof Error ? cause.message : 'Debug-Daten konnten nicht geladen werden.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="debug-layout">
      <Panel eyebrow="Debug" title="Spieleübersicht">
        <div className="button-row">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Aktualisieren
          </Button>
        </div>

        {loading ? <p className="muted">Lade Debug-Daten...</p> : null}
        {error ? <div className="inline-error">{error}</div> : null}

        <div className="debug-list">
          {games.map((game) => (
            <article key={game.id} className="debug-card">
              <div className="debug-card__head">
                <div>
                  <h3>{game.name}</h3>
                  <p className="muted">{game.id}</p>
                </div>
                <Pill tone="gold">{formatGameStatus(game.status)}</Pill>
              </div>

              <div className="debug-player-list">
                {game.players.map((player) => (
                  <div key={player.id} className="debug-player">
                    <div className="debug-player__head">
                      <strong>{player.name}</strong>
                      <span>{player.id}</span>
                    </div>
                    <div className="debug-player__cards">
                      {player.cards.map((card) => (
                        <Pill key={`${card.rank}-${card.suit}`} tone="neutral">
                          {formatCard(card)}
                        </Pill>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}