import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Panel, Pill, SectionHeader } from '../components/Ui';
import { CardTile } from '../components/CardTile';
import { RankSelector } from '../components/RankSelector';
import { PlayerRoster } from '../components/PlayerRoster';
import { createGameSocket, parseServerMessage, sendDoubt, sendPlayCards, startGame, stopGame } from '../lib/api';
import { describeGameEnd, formatGameStatus, getLoserId, isActiveStatus, formatRank } from '../lib/format';
import { useSession } from '../context/SessionContext';
import type { Card, GameStatus, GameView, Rank } from '../types';

type SocketState = 'idle' | 'connecting' | 'open' | 'error' | 'closed';
type HandSortMode = 'manual' | 'rank' | 'symbol';

function cardKey(card: Card) {
  return `${card.rank}-${card.suit}`;
}

function reorderCards(cards: Card[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) {
    return cards;
  }

  const nextCards = [...cards];
  const [movedCard] = nextCards.splice(fromIndex, 1);
  nextCards.splice(toIndex, 0, movedCard);
  return nextCards;
}

function rankSortValue(rank: Rank) {
  return ['Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'].indexOf(rank);
}

function suitSortValue(suit: Card['suit']) {
  return ['Hearts', 'Diamonds', 'Clubs', 'Spades'].indexOf(suit);
}

function cardTilt(index: number, total: number) {
  const center = (total - 1) / 2;
  const tilt = (index - center) * 1.15;
  return Math.max(-5.5, Math.min(5.5, tilt));
}

function cardLift(index: number, total: number, sortMode: HandSortMode) {
  if (sortMode !== 'manual') {
    return Math.max(0, (total - 1 - index) * 0.7);
  }

  return Math.max(0, (total - 1 - index) * 0.8);
}

function sortCards(cards: Card[], sortMode: HandSortMode) {
  const nextCards = [...cards];

  if (sortMode === 'rank') {
    return nextCards.sort((left, right) => {
      const rankDiff = rankSortValue(left.rank) - rankSortValue(right.rank);
      if (rankDiff !== 0) {
        return rankDiff;
      }

      return suitSortValue(left.suit) - suitSortValue(right.suit);
    });
  }

  if (sortMode === 'symbol') {
    return nextCards.sort((left, right) => {
      const suitDiff = suitSortValue(left.suit) - suitSortValue(right.suit);
      if (suitDiff !== 0) {
        return suitDiff;
      }

      return rankSortValue(left.rank) - rankSortValue(right.rank);
    });
  }

  return nextCards;
}

function isCurrentTurn(view: GameView) {
  return view.current_player_id === view.player_id;
}

function statusToTone(status: GameStatus) {
  if (status === 'InProgress') {
    return 'good' as const;
  }

  if (status === 'WaitingForPlayers') {
    return 'warn' as const;
  }

  if (status === 'Stopped') {
    return 'bad' as const;
  }

  return 'gold' as const;
}

export function RoomPage() {
  const navigate = useNavigate();
  const { session, setSession, clearCurrentSession } = useSession();

  const [view, setView] = useState<GameView | null>(null);
  const [socketState, setSocketState] = useState<SocketState>('idle');
  const [socketError, setSocketError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Rank>('Two');
  const [handSortMode, setHandSortMode] = useState<HandSortMode>('manual');
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [manualHandOrder, setManualHandOrder] = useState<Card[]>([]);
  const [showEndPopup, setShowEndPopup] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!session || !session.gameId || !session.playerId) {
      navigate('/');
      return;
    }

    setSocketState('connecting');
    setSocketError(null);
    setSendError(null);

    const socket = createGameSocket(session);
    socketRef.current = socket;

    socket.onopen = () => setSocketState('open');
    socket.onerror = () => setSocketState('error');
    socket.onclose = () => setSocketState('closed');
    socket.onmessage = (event) => {
      const message = parseServerMessage(String(event.data));

      if (message.event === 'Error') {
        setSocketError(message.message);
        return;
      }

      setView(message.gameview);
      setShowEndPopup(true);
      setSession({
        ...session,
        lastStatus: message.gameview.status,
        maxPlayers: message.gameview.max_players,
      });
      setSelectedCards((currentSelection) =>
        currentSelection.filter((card) =>
          message.gameview.hand.some((handCard) => handCard.rank === card.rank && handCard.suit === card.suit),
        ),
      );
      setManualHandOrder((currentOrder) => {
        const nextHandKeys = new Set(message.gameview.hand.map(cardKey));
        const filteredOrder = currentOrder.filter((card) => nextHandKeys.has(cardKey(card)));
        const existingKeys = new Set(filteredOrder.map(cardKey));

        for (const card of message.gameview.hand) {
          if (!existingKeys.has(cardKey(card))) {
            filteredOrder.push(card);
          }
        }

        return filteredOrder;
      });
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [navigate, refreshNonce, session?.gameId, session?.playerId, setSession]);

  if (!session) {
    return (
      <div className="room-shell">
        <Panel eyebrow="Sitzung fehlt" title="Keine aktive Partie gefunden">
          <p className="muted">Die Raumansicht braucht eine gespeicherte Sitzung. Kehre zur Lobby zurück und trete dem Spiel erneut bei.</p>
          <div className="button-row button-row--wrap">
            <Button onClick={() => navigate('/')}>Zur Lobby</Button>
          </div>
        </Panel>
      </div>
    );
  }

  const effectiveStatus = view?.status ?? session.lastStatus ?? 'WaitingForPlayers';
  const currentClaim = view?.current_claim ?? null;
  const currentPlayerName =
    view?.players.find((player) => player.id === view.current_player_id)?.name ?? session.playerName;
  const everyoneElse = view?.players ?? [];
  const totalPlayers = view ? everyoneElse.length + 1 : null;
  const canAct = view ? isCurrentTurn(view) && view.status === 'InProgress' : false;
  const canStartGame = session.isHost && effectiveStatus === 'WaitingForPlayers';
  const canStopGame = session.isHost;
  const currentHand = view?.hand ?? [];
  const displayedHand =
    handSortMode === 'manual' ? (manualHandOrder.length > 0 ? manualHandOrder : currentHand) : sortCards(currentHand, handSortMode);
  const visibleMaxPlayers = view?.max_players ?? session.maxPlayers ?? null;
  const stackCount = view?.center_stack_count ?? 0;

  const toggleCard = (card: Card) => {
    if (!view || !canAct) {
      return;
    }

    setSelectedCards((currentSelection) => {
      const exists = currentSelection.some((candidate) => candidate.rank === card.rank && candidate.suit === card.suit);
      if (exists) {
        return currentSelection.filter((candidate) => candidate.rank !== card.rank || candidate.suit !== card.suit);
      }

      return [...currentSelection, card];
    });
  };

  const setManualSortMode = () => {
    setHandSortMode('manual');
  };

  const handleCardDragStart = (card: Card) => {
    if (!canAct || handSortMode !== 'manual') {
      return;
    }

    setDraggedCard(cardKey(card));
  };

  const handleCardDrop = (targetCard: Card) => {
    if (!canAct || handSortMode !== 'manual' || !draggedCard) {
      return;
    }

    const fromIndex = manualHandOrder.findIndex((card) => cardKey(card) === draggedCard);
    const toIndex = manualHandOrder.findIndex((card) => cardKey(card) === cardKey(targetCard));

    if (fromIndex < 0 || toIndex < 0) {
      setDraggedCard(null);
      return;
    }

    setManualHandOrder((cards) => reorderCards(cards, fromIndex, toIndex));
    setDraggedCard(null);
  };

  const handleCardDragEnd = () => {
    setDraggedCard(null);
  };

  const handleStart = async () => {
    setSendError(null);
    await startGame(session.gameId);
    setRefreshNonce((value) => value + 1);
  };

  const handleStop = async () => {
    setSendError(null);
    await stopGame(session.gameId, session.playerId);
  };

  const handlePlay = () => {
    const socket = socketRef.current;
    if (!socket || !view) {
      return;
    }

    if (selectedCards.length === 0) {
      setSendError('Wähle mindestens eine Karte aus.');
      return;
    }

    setSendError(null);
    sendPlayCards(socket, selectedCards, currentClaim ?? selectedClaim);
    setSelectedCards([]);
  };

  const handleDoubt = () => {
    const socket = socketRef.current;
    if (!socket || !view) {
      return;
    }

    setSendError(null);
    sendDoubt(socket);
  };

  const resumeToLobby = () => setRefreshNonce((value) => value + 1);

  const currentTurnIsMine = view ? view.current_player_id === view.player_id : false;
  const currentClaimLocked = view?.current_claim ?? null;
  const currentGameEnded = Boolean(view && !isActiveStatus(view.status));
  const endReason = view ? describeGameEnd(view.status, view.player_id) : '';
  const loserId = view ? getLoserId(view.status) : null;

  return (
    <div className="room-shell">
      {currentGameEnded && showEndPopup && view ? (
        <div className="end-popup" role="dialog" aria-modal="true" aria-labelledby="end-popup-title">
          <div className="end-popup__backdrop" onClick={() => setShowEndPopup(false)} />
          <div className="end-popup__card panel panel--hero">
            <Pill tone={statusToTone(view.status)}>{formatGameStatus(view.status)}</Pill>
            <h2 id="end-popup-title" className="end-popup__title">
              Spiel beendet
            </h2>
            <p className="end-popup__reason">{endReason}</p>
            <p className="muted">
              {loserId === view.player_id ? 'Dein Spieler ist betroffen.' : 'Die Partie wurde für alle beendet.'}
            </p>
            <div className="button-row button-row--wrap">
              <Button variant="secondary" onClick={resumeToLobby}>
                Nochmals anzeigen
              </Button>
              <Button variant="ghost" onClick={() => setShowEndPopup(false)}>
                Weiter zum Tisch
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  clearCurrentSession();
                  navigate('/');
                }}
              >
                Sitzung verlassen
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="room-hero panel">
        <div className="room-hero__info">
          <Pill tone={statusToTone(effectiveStatus)}>{formatGameStatus(effectiveStatus)}</Pill>
          <h1 className="room-hero__title">{session.gameName}</h1>
          <p className="muted">
            {totalPlayers ? `Spieler: ${totalPlayers}` : 'Spieler laden...'} · Maximal: {visibleMaxPlayers ?? 'unbekannt'}
          </p>
        </div>
        <div className="room-hero__actions">
          {canStartGame ? (
            <Button onClick={handleStart} disabled={!totalPlayers || totalPlayers < 2}>
              Spiel starten
            </Button>
          ) : null}
          {canStopGame ? (
            <Button variant="danger" onClick={handleStop}>
              Spiel stoppen
            </Button>
          ) : null}
        </div>
      </section>

      {socketError ? <div className="inline-error">{socketError}</div> : null}
      {sendError ? <div className="inline-error">{sendError}</div> : null}

      {!view ? (
        <Panel eyebrow="Verbindung" title="Spiel wird geladen">
          <p className="muted">{socketState === 'connecting' ? 'Verbinde mit dem Spieltisch...' : 'Warte auf den ersten State.'}</p>
        </Panel>
      ) : null}

      <div className={`room-grid ${currentGameEnded ? 'room-grid--ended' : ''}`}>
        <Panel eyebrow="Tisch" title="Spielübersicht">
          <div className="table-grid">
            <div className="table-grid__tile table-grid__tile--stack">
              <span>Stapel</span>
              <strong>{stackCount}</strong>
            </div>
            <div className="table-grid__tile">
              <span>Ansage</span>
              <strong>{currentClaimLocked ? formatRank(currentClaimLocked) : 'Frei'}</strong>
            </div>
            <div className="table-grid__tile">
              <span>Am Zug</span>
              <strong>{currentPlayerName}</strong>
            </div>
          </div>

          <div className="center-stack">
            <div className="center-stack__label">Karten in der Mitte</div>
            <div className="center-stack__pile" aria-hidden="true">
              <span className="center-stack__card center-stack__card--back center-stack__card--one" />
              <span className="center-stack__card center-stack__card--back center-stack__card--two" />
              <span className="center-stack__card center-stack__card--back center-stack__card--three" />
              <span className="center-stack__card center-stack__card--face">
                <span className="center-stack__face-label">{currentClaimLocked ? formatRank(currentClaimLocked) : 'Lüge'}</span>
                <span className="center-stack__face-suit">{currentClaimLocked ? '♠' : '♣'}</span>
              </span>
              <span className="center-stack__count">{stackCount}</span>
            </div>
            <div className="center-stack__hint">
              {currentClaimLocked ? `Aktuelle Ansage: ${formatRank(currentClaimLocked)}` : 'Noch keine Karte auf dem Stapel'}
            </div>
          </div>

          <PlayerRoster
            currentPlayerName={session.playerName}
            currentPlayerId={view?.player_id ?? session.playerId}
            players={everyoneElse}
            currentTurnPlayerId={view?.current_player_id ?? session.playerId}
          />
        </Panel>

        <Panel eyebrow="Aktionen" title={currentTurnIsMine ? 'Du bist dran' : 'Warte auf deinen Zug'}>
          <SectionHeader
            title="Ansage wählen"
            description={currentClaim ? `Aktuelle Ansage: ${formatRank(currentClaim)}` : 'Wähle die Ansage für deinen Zug.'}
          />
          <RankSelector value={selectedClaim} lockedRank={currentClaim} onChange={setSelectedClaim} />

          <SectionHeader
            title="Hand sortieren"
            description="Zieh Karten im manuellen Modus per Drag-and-Drop um. Bei Sortierung wird die Reihenfolge automatisch gesetzt."
          />

          <div className="hand-sort-controls">
            <Button variant={handSortMode === 'manual' ? 'primary' : 'secondary'} onClick={setManualSortMode}>
              Manuell
            </Button>
            <Button variant={handSortMode === 'rank' ? 'primary' : 'secondary'} onClick={() => setHandSortMode('rank')}>
              Nach Zahl
            </Button>
            <Button
              variant={handSortMode === 'symbol' ? 'primary' : 'secondary'}
              onClick={() => setHandSortMode('symbol')}
            >
              Nach Symbol
            </Button>
          </div>

          <SectionHeader
            title="Hand"
            description={view ? (currentTurnIsMine ? 'Klicke Karten an, um sie auszuwählen.' : 'Nur in deinem Zug aktiv.') : 'Warte auf den Spielstatus.'}
          />

          <div className="hand-grid">
            {displayedHand.map((card, index) => {
              const selected = selectedCards.some((candidate) => candidate.rank === card.rank && candidate.suit === card.suit);
              const cardIdentifier = cardKey(card);
              return (
                <CardTile
                  key={cardIdentifier}
                  card={card}
                  selected={selected}
                  disabled={!canAct}
                  dragging={draggedCard === cardIdentifier}
                  tilt={cardTilt(index, displayedHand.length)}
                  lift={cardLift(index, displayedHand.length, handSortMode)}
                  draggable={canAct && handSortMode === 'manual'}
                  onDragStart={() => handleCardDragStart(card)}
                  onDragOver={(event) => {
                    if (canAct && handSortMode === 'manual') {
                      event.preventDefault();
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleCardDrop(card);
                  }}
                  onDragEnd={handleCardDragEnd}
                  onClick={() => toggleCard(card)}
                />
              );
            })}
          </div>

          <div className="button-row button-row--wrap">
            <Button onClick={handlePlay} disabled={!canAct || selectedCards.length === 0}>
              Karte legen
            </Button>
            <Button variant="secondary" onClick={handleDoubt} disabled={!canAct || (view?.center_stack_count ?? 0) === 0}>
              Lüge!
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedCards([])}
              disabled={!canAct || selectedCards.length === 0}
            >
              Auswahl löschen
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}