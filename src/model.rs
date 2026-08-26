use serde::{Deserialize, Serialize};
use uuid::Uuid;
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Suit {
    Hearts,
    Diamonds,
    Clubs,
    Spades,
}

impl Suit {
    // Ein Array, das alle möglichen Werte enthält
    pub const ALL: [Suit; 4] = [Suit::Hearts, Suit::Diamonds, Suit::Clubs, Suit::Spades];
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Rank {
    Two,
    Three,
    Four,
    Five,
    Six,
    Seven,
    Eight,
    Nine,
    Ten,
    Jack,
    Queen,
    King,
    Ace,
}

impl Rank {
    pub const ALL: [Rank; 13] = [
        Rank::Two,
        Rank::Three,
        Rank::Four,
        Rank::Five,
        Rank::Six,
        Rank::Seven,
        Rank::Eight,
        Rank::Nine,
        Rank::Ten,
        Rank::Jack,
        Rank::Queen,
        Rank::King,
        Rank::Ace,
    ];
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Card {
    pub rank: Rank,
    pub suit: Suit,
}

#[derive(Debug, Clone, Serialize)]
pub struct Player {
    pub id: Uuid,
    pub name: String,
    pub hand: Vec<Card>, // Die Karten die der Spieler auf der Hand hat
}

#[derive(Debug, Clone, Serialize)]
pub struct StackPlay {
    // Stapel für eine runde
    pub player_id: Uuid,
    pub cards: Vec<Card>, // Die tatsächlich gelegten Karten
    pub claim: Rank,      // Die behauptung welche Karten gelegt sind
}
#[derive(Debug, Clone, PartialEq, Serialize)]
pub enum GameStatus {
    WaitingForPlayers,
    InProgress,
    Finished { loser_id: Uuid },
    LostByAces { loser_id: Uuid },
    Stopped,
}
#[derive(Debug, Clone, Serialize)]
pub struct Game {
    pub id: Uuid,
    pub name: String,
    pub players: Vec<Player>,
    pub max_players: u32,
    pub current_turn_index: usize,    // Welcher Spieler ist dran?
    pub center_stack: Vec<StackPlay>, // Alle in dieser Runde gelegten Karten
    pub current_claim: Option<Rank>, // Was muss der nächste Spieler bedienen? (Wird beim anzweifeln auf null gesetzt)
    pub status: GameStatus,
}
#[derive(Clone, Debug, Serialize)]
pub struct GameView {
    pub player_id: Uuid,
    pub game_id: Uuid,
    pub current_player_id: Uuid,
    pub center_stack_count: usize,
    pub current_claim: Option<Rank>,
    pub status: GameStatus,
    pub hand: Vec<Card>,
    pub players: Vec<PlayerPublicInfo>,
    pub max_players: u32,
}
#[derive(Clone, Debug, Serialize)]
pub struct PlayerPublicInfo {
    pub id: Uuid,
    pub name: String,
}
#[derive(Debug, Serialize)]
pub enum GameError {
    MaxPlayersReached, //idk ob hier nen anderer enum sinnvollerer wäre weil das nicht zur spiellaufzeit ist aber juckt ig
    NotYourTurn,
    InvalidPlay,
    InvalidClaim,
    GameAlreadyFinished,
}
#[derive(Debug, PartialEq, Eq, Serialize)]
pub enum DoubtOutcome {
    Successful,
    Failed,
}
