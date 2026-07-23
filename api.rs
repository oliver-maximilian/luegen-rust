use axum::{
    Form, Json, Router, extract::{State, ws::{Message, WebSocket, WebSocketUpgrade}}, http::StatusCode, http::header, http::Uri, response::IntoResponse, response::Response, body::Body, routing::{get, post}
};
use axum::extract::Query;
use tokio::sync::broadcast;

use serde_json::{from_str, to_string};
use crate::model::{Game, GameStatus, GameView};
use crate::api_model::{ApiError, AppState, WsClientMessage, WsServerMessage, ConnectGameMessage, CreateGameMessage, CreateGameResponse, JoinGameMessage, JoinGameResponse, StartGameMessage, StopGameMessage, DebugGame, DebugGameResponse, DebugPlayer};
use uuid::Uuid;

use dashmap::{DashMap, };
use std::{sync::Arc};
use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "frontend/dist/"]
struct Frontend;

async fn frontend_handler(uri: Uri) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/');

    serve_embedded(path).unwrap_or_else(|| {
        // SPA-Fallback: unbekannte Pfade -> index.html (React-Router etc.)
        serve_embedded("index.html")
            .unwrap_or_else(|| StatusCode::NOT_FOUND.into_response())
    })
}
fn serve_embedded(path: &str) -> Option<Response> {
    let asset = Frontend::get(path)?;
    let mime = mime_guess::from_path(path).first_or_octet_stream();

    Some(
        Response::builder()
            .header(header::CONTENT_TYPE, mime.as_ref())
            .body(Body::from(asset.data.into_owned()))
            .unwrap(),
    )
}

fn create_router(state: Arc<AppState>, debug: bool) -> Router {
    let mut router = Router::new()
        .route("/api/game", get(ws_handler))
        .route("/api/game/create", post(create_game_handler))
        .route("/api/game/join", post(join_game_handler))
        .route("/api/game/start", post(start_game_handler))
        .route("/api/game/stop", post(stop_game_handler));

    if debug {
        router = router.route("/api/debug/game", get(debug_game_handler));
    }

    router
        .fallback(frontend_handler)
        .with_state(state)
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(data): Query<ConnectGameMessage>,
    State(state): State<Arc<AppState>>,
) -> impl  IntoResponse {

    let tx = state.channels
    .entry(data.game_id.clone())
    .or_insert_with(|| broadcast::channel(100).0)
    .clone();

    ws.on_upgrade(move |socket| handle_socket(socket, tx, data.game_id, data.player_id, state))
}

async fn create_game_handler(State(state): State<Arc<AppState>>, Form(data): Form<CreateGameMessage>) -> Result<Json<CreateGameResponse>,ApiError> { 

    for game in state.games.iter() {
        if game.value().name == data.game_name {
            return Err(ApiError::GameNameAlreadyExists);
        }
    }

    let game_id = Uuid::new_v4();
    let game = Game::new(data.player_name, data.game_name, data.max_players);

    let player_id = game.players[0].id.clone();

    state.games.insert(game_id.to_string(), game);
    
    let response = CreateGameResponse {
        player_id: player_id.to_string(),
        game_id: game_id.to_string()
    };
    Ok(Json(response))
}

async fn join_game_handler(State(state): State<Arc<AppState>>, Form(data): Form<JoinGameMessage>,) -> Result<Json<JoinGameResponse>, ApiError> {


    let game_id = state
        .games
        .iter()
        .find(|entry| entry.value().name == data.game_name)
        .map(|entry| entry.key().clone())
        .ok_or(ApiError::GameNotFound)?;

    let mut game_instance = state
        .games
        .get_mut(&game_id)
        .ok_or(ApiError::GameNotFound)?;

    if game_instance.status != GameStatus::WaitingForPlayers {
        return Err(ApiError::GameRunning);
    }

    if game_instance.players.len() >= game_instance.max_players.try_into().unwrap() { // hoffentlich kommt hier keine panic
        return Err(ApiError::LobbyFull);
    }

    let player_id = game_instance
        .add_player(data.player_name)
        .map_err(|_| ApiError::JoinGameFailed)?;

    if let Some(tx) = state.channels.get(&game_id) {
        let _ = tx.send(game_id.clone());
    }

    Ok(Json(JoinGameResponse {
        player_id,
        game_id,
    }))
}

async fn start_game_handler(State(state): State<Arc<AppState>>, Form(data): Form<StartGameMessage>) -> Result<StatusCode, ApiError> {

    if !state.games.contains_key(&data.game_id) {
        return Err(ApiError::GameNotFound);
    }



    if let Some(mut game_instance) = state.games.get_mut(&data.game_id) {

        if game_instance.status == GameStatus::InProgress {
            return Err(ApiError::GameRunning);
        }
        if game_instance.players.len() == 1 {
            return Err(ApiError::OnlyOnePlayer)
        }

        game_instance.start();

        if let Some(tx) = state.channels.get(&game_instance.id.to_string()) {
            let _ = tx.send(game_instance.id.to_string().clone());
        }
    }



    return Ok(StatusCode::OK);
}
async fn stop_game_handler(State(state): State<Arc<AppState>>, Form(data): Form<StopGameMessage>) -> Result<StatusCode, ApiError> {

    let mut game_instance = state.games.get_mut(&data.game_id).ok_or(ApiError::GameNotFound)?;

    // if game_instance.players[0].id !=
    let player_id = match Uuid::parse_str(&data.player_id) {
        Ok(id) => id,
        Err(_) => {
            return Err(ApiError::PlayerNotFound);
        }
    };

    if game_instance.players[0].id != player_id {
        return Err(ApiError::PlayerNotAllowed);
    }

    game_instance.status = GameStatus::Stopped; // dazu gleich mehr
    drop(game_instance); // Lock explizit freigeben, bevor wir tx.send() aufrufen - nicht zwingend nötig hier, aber guter Stil

    if let Some(tx) = state.channels.get(&data.game_id) {
        let _ = tx.send(data.game_id.clone());
    }

    Ok(StatusCode::OK)
}

async fn debug_game_handler(
    State(state): State<Arc<AppState>>
) -> Result<Json<DebugGameResponse>, ApiError> {

    let mut games: Vec<DebugGame> = Vec::new();

    for game_entry in &state.games {
        let game_id = game_entry.key().clone();
        let game = game_entry.value();

        let game_name = game.name.clone();

        let game_status = game.status.clone();

        let mut players: Vec<DebugPlayer> = Vec::new();

        for player in &game.players {
            players.push(DebugPlayer {
                id: player.id.clone().to_string(),
                name: player.name.clone(),
                cards: player.hand.clone(),
            });
        }

        games.push(DebugGame {
            name: game_name,
            id: game_id,
            players,
            status: game_status
        });
    }

    Ok(Json(DebugGameResponse { games }))
}

async fn handle_socket(
    mut socket: WebSocket,
    tx: broadcast::Sender<String>,
    game_id: String,
    player_id: String,
    state: Arc<AppState>,
) {
    let mut rx = tx.subscribe();

    let player_id = match Uuid::parse_str(&player_id) {
        Ok(id) => id,
        Err(_) => {
            send_message(&mut socket, Some("Invalid player_id".into()), true, None).await;
            return;
        }
    };

    let initial_view = state.games.get_mut(&game_id)
        .map(|mut g| g.get_player_gameview(player_id));

    if let Some(view) = initial_view {
        send_message(&mut socket, None, false, Some(view)).await;
    }
    else {
        send_message(&mut socket, Some(String::from("Game not Found")), false, None).await;
    }

    loop {
        tokio::select! {
            recv_result = socket.recv() => {
                match recv_result {
                    Some(Ok(Message::Text(text))) => {
                        match from_str::<WsClientMessage>(&text) {
                            Ok(client_msg) => {
                                // Guard lebt nur in diesem Block, ist danach weg
                                let result = {
                                    let mut game_instance = match state.games.get_mut(&game_id) {
                                        Some(g) => g,
                                        None => {
                                            send_message(&mut socket, Some("Game not found".into()), true, None).await;
                                            continue;
                                        }
                                    };

                                    if !game_instance.players.iter().any(|p| p.id == player_id) {
                                        send_message(&mut socket, Some("Player not found".into()), true, None).await;
                                        continue;
                                    }

                                    match client_msg {
                                        WsClientMessage::PlayCards { cards, claim } => {
                                            game_instance.play_cards(&player_id, cards, claim)
                                        }
                                        WsClientMessage::Doubt => {
                                            game_instance.doubt(&player_id).map(|_| ())
                                        }
                                    }
                                };

                                match result {
                                    Ok(_) => {
                                        let _ = tx.send(game_id.clone()); // nur ein Signal, Inhalt ist egal
                                    }
                                    Err(e) => {
                                        send_message(&mut socket, Some(format!("{:?}", e)), true, None).await;
                                    }
                                }
                            }
                            Err(e) => {
                                send_message(&mut socket, Some(e.to_string()), true, None).await;
                            }
                        }
                    }
                    Some(Ok(_)) => {
                        // Ping/Pong/Binary/Close-Frame - ignorieren
                    }
                    Some(Err(_)) | None => {
                        break; // Verbindung tot oder fehlerhaft -> Loop verlassen
                    }
                }
            }

            recv_result = rx.recv() => {
                match recv_result {
                    Ok(_) | Err(broadcast::error::RecvError::Lagged(_)) => {
                        let view = state.games.get_mut(&game_id)
                            .map(|mut g| g.get_player_gameview(player_id));

                        if let Some(view) = view {
                            send_message(&mut socket, None, false, Some(view)).await;
                        }
                    }
                    Err(broadcast::error::RecvError::Closed) => {
                        break;
                    }
                }
            }
        }
    }
}

async fn send_message(socket: &mut WebSocket, msg: Option<String>, is_error: bool, gameview: Option<GameView>) { // vllt wären hier 2 funktionen für fehler und normal besser
    if is_error {
        if let Some(message) = msg {
            match to_string(&WsServerMessage::Error { message: message }) {
                Ok(json) => {
                    let _ = socket.send(Message::Text(json.into())).await;
                }
                Err(e) => {
                    eprintln!("Konnte JSON nicht serialisieren: {}", e);
                }
            }
        }
    } 
    else if let Some(game) = gameview {
        match to_string(&WsServerMessage::StateUpdate { gameview: game }) {
            Ok(json) => {
                let _ = socket.send(Message::Text(json.into())).await;
            }
            Err(e) => {
                eprintln!("Konnte JSON nicht serialisieren: {}", e);
            }
        }
    }
}

pub async fn start_server(debug: bool) {
    let channel_dashmap: DashMap<String, broadcast::Sender<String>> = DashMap::new();
    let game_dashmap: DashMap<String, crate::model::Game> = DashMap::new();
    let state: AppState = AppState { channels: channel_dashmap, games: game_dashmap };

    let arc_state: Arc<AppState> = Arc::new(state);

    let app = create_router(arc_state, debug);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}