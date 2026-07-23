import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame, joinGame } from '../lib/api';
import { useSession } from '../context/SessionContext';
import { Button, Field, Panel, Pill } from '../components/Ui';

const DEFAULT_MAX_PLAYERS = 4;

export function HomePage() {
  const navigate = useNavigate();
  const { session, setSession, clearCurrentSession } = useSession();

  const [createGameName, setCreateGameName] = useState('');
  const [createPlayerName, setCreatePlayerName] = useState('');
  const [createMaxPlayers, setCreateMaxPlayers] = useState(DEFAULT_MAX_PLAYERS);

  const [joinGameName, setJoinGameName] = useState('');
  const [joinPlayerName, setJoinPlayerName] = useState('');

  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy('create');
    setError(null);

    try {
      const response = await createGame({
        gameName: createGameName.trim(),
        playerName: createPlayerName.trim(),
        maxPlayers: createMaxPlayers,
      });

      setSession({
        gameId: response.game_id,
        gameName: createGameName.trim(),
        playerId: response.player_id,
        playerName: createPlayerName.trim(),
        isHost: true,
        maxPlayers: createMaxPlayers,
        lastStatus: 'WaitingForPlayers',
      });
      navigate('/room');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Spiel konnte nicht erstellt werden.');
    } finally {
      setBusy(null);
    }
  };

  const handleJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy('join');
    setError(null);

    try {
      const response = await joinGame({
        gameName: joinGameName.trim(),
        playerName: joinPlayerName.trim(),
      });

      setSession({
        gameId: response.game_id,
        gameName: joinGameName.trim(),
        playerId: response.player_id,
        playerName: joinPlayerName.trim(),
        isHost: false,
        lastStatus: 'WaitingForPlayers',
      });

      navigate('/room');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Spiel konnte nicht beigetreten werden.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="home-layout">
      <section className="hero panel panel--hero">
        <div className="hero__copy">
          <Pill tone="gold">Lügen · Kartenspiel</Pill>
          <h1 className="hero__title">Bluffe sauber. Lies den Tisch. Gewinne mit Haltung.</h1>
          <p className="hero__text">
            Ein atmosphärisches Frontend für Lobby, Spieltisch und Debug-Ansicht mit persistenter Sitzung und
            WebSocket-gestützter Spiellogik.
          </p>
        </div>

        <div className="hero__aside">
          <div className="hero__stat">
            <span>Aktive Sitzung</span>
            <strong>{session ? `${session.playerName} in ${session.gameName}` : 'Keine'}</strong>
          </div>
          {session ? (
            <Button variant="secondary" onClick={clearCurrentSession}>
              Sitzung löschen
            </Button>
          ) : null}
        </div>
      </section>

      {error ? <div className="inline-error">{error}</div> : null}

      <div className="home-grid">
        <Panel eyebrow="Erstellen" title="Neue Runde starten">
          <form className="stack-form" onSubmit={handleCreate}>
            <Field label="Spielname">
              <input value={createGameName} onChange={(event) => setCreateGameName(event.target.value)} required />
            </Field>
            <Field label="Dein Name">
              <input value={createPlayerName} onChange={(event) => setCreatePlayerName(event.target.value)} required />
            </Field>
            <Field label="Max. Spieler" hint="Wert wird an das Backend gesendet.">
              <select value={createMaxPlayers} onChange={(event) => setCreateMaxPlayers(Number(event.target.value))}>
                {[2, 3, 4, 5, 6, 7, 8].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit" disabled={busy !== null}>
              {busy === 'create' ? 'Erstelle...' : 'Spiel erstellen'}
            </Button>
          </form>
        </Panel>

        <Panel eyebrow="Beitreten" title="Bestehender Tisch">
          <form className="stack-form" onSubmit={handleJoin}>
            <Field label="Spielname">
              <input value={joinGameName} onChange={(event) => setJoinGameName(event.target.value)} required />
            </Field>
            <Field label="Dein Name">
              <input value={joinPlayerName} onChange={(event) => setJoinPlayerName(event.target.value)} required />
            </Field>
            <Button type="submit" disabled={busy !== null}>
              {busy === 'join' ? 'Tritt bei...' : 'Spiel betreten'}
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}