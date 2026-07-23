use axum::{
    Json, http::{StatusCode}, response::{IntoResponse, Response}
};
use tokio::sync::broadcast;

use serde::{Deserialize, Serialize, };
use crate::model::{Card, GameStatus, GameView,Rank};

use dashmap::{DashMap, };


pub enum ApiError {
    GameNotFound,
    GameNameAlreadyExists,
    LobbyFull,
    JoinGameFailed,
    GameRunning,
    PlayerNotAllowed,
    PlayerNotFound,
    OnlyOnePlayer,
}
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, msg) = match self {
            ApiError::GameNotFound => (StatusCode::NOT_FOUND, "game not found"),
            ApiError::GameNameAlreadyExists => (StatusCode::CONFLICT, "game name already exists"),
            ApiError::LobbyFull => (StatusCode::CONFLICT, "lobby is full"),
            ApiError::JoinGameFailed => (StatusCode::INTERNAL_SERVER_ERROR, "joining game failed"),
            ApiError::GameRunning => (StatusCode::CONFLICT, "game is already running"),
            ApiError::PlayerNotAllowed => (StatusCode::FORBIDDEN, "player not allowed"),
            ApiError::PlayerNotFound => (StatusCode::NOT_FOUND, "player not found"),
            ApiError::OnlyOnePlayer => (StatusCode::CONFLICT, "only one player in lobby"),
        };
        (status, Json(serde_json::json!({ "error": msg }))).into_response()
    }
}

// Frontend -> Backend
#[derive(Deserialize, Debug)]
#[serde(tag = "action")] // Macht daraus {"action": "PlayCards", "player_id": "...", ...}
pub enum WsClientMessage {
    PlayCards { cards: Vec<Card>, claim: Rank },
    Doubt,
}

// Backend -> Frontend
#[derive(Serialize, Clone, Debug)]
#[serde(tag = "event")]
pub enum WsServerMessage {
    StateUpdate { gameview: GameView },
    Error { message: String },
}

#[derive(Debug, Deserialize)]
pub struct CreateGameMessage {
    pub game_name: String,
    pub player_name: String,
    pub max_players: u32,
}
#[derive(Serialize)]
pub struct CreateGameResponse {
    pub player_id: String,
    pub game_id: String
}

#[derive(Debug, Deserialize)]
pub struct JoinGameMessage {
    pub player_name: String,
    pub game_name: String
}
#[derive(Serialize)]
pub struct JoinGameResponse {
    pub player_id: String,
    pub game_id: String
}
#[derive(Debug, Deserialize)]
pub struct StartGameMessage {
    pub game_id: String
}
#[derive(Debug, Deserialize)]
pub struct StopGameMessage {
    pub game_id: String,
    pub player_id: String
}
#[derive(Serialize)]
pub struct DebugGameResponse {
    pub games: Vec<DebugGame>,
}

#[derive(Serialize)]
pub struct DebugGame {
    pub id: String,
    pub name: String,
    pub status: GameStatus,
    pub players: Vec<DebugPlayer>,
}

#[derive(Serialize)]
pub struct DebugPlayer {
    pub id: String,
    pub name: String,
    pub cards: Vec<Card>
}
#[derive(Deserialize)]
pub struct ConnectGameMessage {
    pub game_id: String,
    pub player_id: String,
}

pub struct AppState {
    pub channels: DashMap<String, broadcast::Sender<String>>,
    pub games: DashMap<String, crate::model::Game>
}