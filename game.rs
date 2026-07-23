use crate::model::{Card, DoubtOutcome, Game, GameError, GameStatus, GameView, Player, PlayerPublicInfo, Rank, StackPlay, Suit};
use uuid::{Uuid};
use rand::Rng;

impl Game{
    
    pub fn new(host_name: String, game_name: String, max_players: u32,) -> Self {
        
        let players: Vec<Player> = Vec::new();

        let game_center_stack: Vec<StackPlay> = Vec::new();

        let game_status = GameStatus::WaitingForPlayers;

        let mut game: Game = Game { id: Uuid::new_v4(), name: game_name, players, current_turn_index: 0, center_stack: game_center_stack, current_claim: None, status: game_status, max_players: max_players};

        
        if let Err(err) = game.add_player(host_name) {
            eprintln!("{:?}", err)
        }

        game
    
    }

    pub fn add_player(&mut self, player_name: String) -> Result<String, GameError> {
        
        if self.players.len() >= self.max_players.try_into().unwrap() { // hoffentlich crasht hier .unwrap nicht
            Err(GameError::MaxPlayersReached)
        }
        else {
            let player_id = Uuid::new_v4();
            self.players.push(Player { id: player_id, name: player_name, hand: Vec::new() });
            Ok(player_id.to_string())
        }
    }
    
    pub fn start(&mut self) {

        for player in &mut self.players {
            player.hand.clear();
        }
        self.center_stack.clear();
        self.current_claim = None;
        self.current_turn_index = 0;

        let mut deck = Vec::new();
        for &suit in &Suit::ALL {
            for &rank in &Rank::ALL {
                deck.push(Card { rank, suit });
            }
        }

        let mut rng = rand::thread_rng();
        let mut player_index = 0;

        while !deck.is_empty() {
            let deck_index = rng.gen_range(0..deck.len());
            let card = deck.remove(deck_index);
            self.players[player_index].hand.push(card);
            player_index = (player_index + 1) % self.players.len();
        }

        self.status = GameStatus::InProgress;
    }

    pub fn play_cards(&mut self, player_id: &Uuid, cards: Vec<Card>, claim: Rank) -> Result<(), GameError> {
        

        if self.status != GameStatus::InProgress {
            return Err(GameError::GameAlreadyFinished);
        }

        if cards.is_empty() {
            return Err(GameError::InvalidPlay);
        }

        if self.players[self.current_turn_index].id != *player_id {
                return Err(GameError::NotYourTurn);
        }

        //idk ob man das behalten muss aber nen ass claimen macht halt keinen sinn
        if claim == Rank::Ace{
            return Err(GameError::InvalidPlay);
        }

        if let Some(current) = self.current_claim {
            if current != claim {
                return Err(GameError::InvalidClaim); // claim passt net
            }
        } 
        else {
            self.current_claim = Some(claim);
        }



        let player = &mut self.players[self.current_turn_index];
        let mut temp_hand = player.hand.clone();


        // Prüft ob der spieler die Karten die er spielen möchte überhaupt auf der Hand hat
        for card in &cards {        
            // idk was hier passiert das so ki bullshit, klappt aber hoffentlich
            if let Some(index) = temp_hand.iter().position(|c| c == card) {
                temp_hand.remove(index);
            } 
            else {
                return Err(GameError::InvalidPlay);
            }
        }
        
        player.hand = temp_hand;

        let play = StackPlay {
            player_id: *player_id,
            cards: cards,
            claim: claim,
        };
    
        self.center_stack.push(play);


        loop {
            self.current_turn_index = (self.current_turn_index + 1) % self.players.len();
            
            // Wenn der Spieler an diesem Index noch Karten hat, ist er dran!
            if !self.players[self.current_turn_index].hand.is_empty() {
                break;
            }
        }
        self.check_win_condition();

        Ok(())
    }

    pub fn doubt(&mut self, player_id: &Uuid) -> Result<DoubtOutcome, GameError> {

        if self.status != GameStatus::InProgress {
            return Err(GameError::GameAlreadyFinished);
        }

        // Ist der Spieler überhaupt dran?
        if self.players[self.current_turn_index].id != *player_id {
            return Err(GameError::NotYourTurn);
        }

        if self.center_stack.is_empty() {
            return Err(GameError::InvalidPlay);
        }

        let last_stack = self.center_stack.last().unwrap(); 

        // 2. Die ID des wahren Übeltäters auslesen
        // Wir klonen die ID, damit wir gleich danach den center_stack leeren (drain) können
        let last_player_id = last_stack.player_id.clone();

        // 3. Den Index dieses Spielers in unserer Liste finden
        let last_player_index = self.players
            .iter()
            .position(|p| p.id == last_player_id)
            .unwrap(); 

        let mut is_lie = false;

        for card in &last_stack.cards {
            if card.rank != last_stack.claim {
                is_lie = true;
                break;
            }
        }

        let outcome = if is_lie {
            DoubtOutcome::Successful
        } else {
            DoubtOutcome::Failed
        };

        let loser_index = if is_lie {
            last_player_index // Der Lügner
        } else {
            self.current_turn_index // Der falsche Zweifler
        };

        let mut all_cards = Vec::new();
        // drain(..) leert den gesamten center_stack und gibt Karten zurück
        for play in self.center_stack.drain(..) { 
            all_cards.extend(play.cards);
        }

        self.players[loser_index].hand.extend(all_cards);

        self.current_claim = None;
        
        // Verlierer fängt nächste Runde an
        self.current_turn_index = loser_index; 

        let loser_id = self.players[loser_index].id.clone(); 
        let has_four_aces = self.check_for_four_aces(&loser_id); 
        
        if has_four_aces {
            self.status = GameStatus::LostByAces { loser_id };
            return Ok(outcome); 
        }
        
        self.check_win_condition();

        Ok(outcome)
    }
        
    fn check_for_four_aces(&self, player_id: &Uuid) -> bool {
        for player in &self.players {
            
            if &player.id == player_id {
                let mut ace_count = 0;

                for card in &player.hand {
                    if card.rank == Rank::Ace {
                        ace_count += 1;
                    }
                }
                return ace_count >= 4;
            }
        }
        false
    }

    fn check_win_condition(&mut self) {
        let mut active_players_count = 0;
        let mut possible_loser_id = None;

        // Wir zählen, wer noch im Spiel ist
        for player in &self.players {
            if !player.hand.is_empty() {
                active_players_count += 1;
                possible_loser_id = Some(player.id.clone());
            }
        }

        // Wenn maximal noch eine Person Karten hat, ist das Spiel vorbei
        if active_players_count <= 1 {
            if let Some(loser_id) = possible_loser_id {
                // Spiel beenden und den letzten Spieler als Verlierer markieren
                self.status = GameStatus::Finished { loser_id };
            }
        }
    }

    pub fn get_player_gameview(&mut self, player_id: Uuid) -> GameView {

        let mut hand: Vec<Card> = Vec::new();

        let mut player_public_info: Vec<PlayerPublicInfo> = Vec::new();

        for player in &self.players {
            if player.id == player_id {
                hand = player.hand.clone();
            }
            else{
                player_public_info.push(PlayerPublicInfo { id: player.id, name: player.name.clone() });
            }
        }
        GameView { player_id, game_id: self.id.clone(), current_player_id: self.players[self.current_turn_index].id, center_stack_count: self.center_stack.len(), current_claim: self.current_claim, status: self.status.clone(), hand, players: player_public_info, max_players: self.max_players }
    }
}