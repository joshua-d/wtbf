//TODO this stuff is placeholders until I connect the real database!
let Game = require('./game/game.js');

/* [ { id, players: [conn_id] } ] */
let rooms = [];

/* [Game] */
let games = [];

let game_by_conn_id = {};
let player_id_by_conn_id = {};

let next_conn_id = 0;
let next_game_id = 0;


/* Holds data about each game, indexed by game.id
* action_queue: list of actions for each player as they come in
* performing_turn: true if the game has turned and not all players have received the new state
*
* {
*   action_queue: [ { type: 'move'/'stay', player_id, ?loc_id } ]
*   performing_turn: boolean
* }
* */
let game_data_table = {};


/* Rooms */

function _generate_room_id() {
    let room_id;
    let room_exists = false;
    do {
        let room_num = Math.floor(Math.random() * 10000);
        room_id = "" + room_num;
        while (room_id.length < 4)
            room_id = '0' + room_id;

        room_exists = false;
        for (let room of rooms) {
            if (room.id === room_id) {
                room_exists = true;
                break;
            }
        }
    }
    while(room_exists);
    return room_id;
}

function _generate_connection_id() {
    return String(next_conn_id++);
}

/* Returns a room id & conn id for the user who created the room */
function create_room() {
    let room_id = _generate_room_id();
    let conn_id = _generate_connection_id();

    rooms.push({id: room_id, players: [conn_id]});

    console.log(`Player ${conn_id} created room ${room_id}`);

    return {
        conn_id: conn_id,
        room_id: room_id
    }
}

/* Returns a room id & conn id if the user successfully joined the room */
function join_room(room_id) {
    let conn_id = _generate_connection_id();
    for (let room of rooms) {
        if (room.id === room_id) {
            room.players.push(conn_id);
            console.log(`${conn_id} joined room ${room_id}`);
            return {
                conn_id: conn_id,
                room_id: room.id
            }
        }
    }
}


/* Game */

function _generate_game_id() {
    return next_game_id++;
}

/* Returns true if game started, false if failed */
function start_game(conn_id) {
    for (let room of rooms) {
        if (room.players.includes(conn_id)) {
            let game = new Game(_generate_game_id(), room.players.length);
            for (let player_id = 0; player_id < room.players.length; player_id++) {
                let player = room.players[player_id];
                game_by_conn_id[player] = game;
                player_id_by_conn_id[player] = player_id;
                game_data_table[game.id] = {
                    action_queue: [],
                    performing_turn: false,
                    next_state_ready: false,
                    num_players_received_state: 0 // TODO a counter is used to check if all players have received the state - susceptible to tomfoolery
                };
            }
            games.push(game);
            console.log('game started');
            return true;
        }
    }
    return false;
}

function check_if_game_started(conn_id) {
    return conn_id in game_by_conn_id;
}

function _get_player_id(conn_id) {
    return player_id_by_conn_id[conn_id];
}

function get_game_state(conn_id) {
    let game = game_by_conn_id[conn_id];
    let game_state = game.get_full_state();
    game_state.your_id = _get_player_id(conn_id);
    game_state.your_loc = game_state.players[game_state.your_id].location;
    return game_state
}

/* After a player submits an action, this is called to check if all actions have come in
*  If they have, turn is done, game_data.state is set and next_state_ready flag set to true */
function _check_for_turn_ready(game) {
    let game_data = game_data_table[game.id];
    if (game_data.action_queue.length === game.players.length) {

        // All actions in, process the queue and do the turn
        game_data.performing_turn = true;
        for (let action of game_data.action_queue) {
            if (action.type === 'move') {
                game.move_player(action.player_id, action.loc_id);
            }
        }
        game_data.action_queue = [];

        game.do_turn();
        game_data.next_state_ready = true;
    }
}

/* Returns whether or not move was successful - FE checks first, so there's tomfoolery if false */
function move_player(conn_id, loc_id) {
    let game = game_by_conn_id[conn_id];
    let player_id = player_id_by_conn_id[conn_id];
    let game_data = game_data_table[game.id];

    // Again, in 'prod' would have to check if there is already an action for this player in case they tomfool the FE
    if (!game_data.performing_turn && game.can_move(player_id, loc_id)) {
        game_data.action_queue.push({
            action: 'move',
            player_id: player_id,
            loc_id: loc_id
        });
        _check_for_turn_ready(game);
        return true;
    }

    return false;
}

function stay_player(conn_id) {
    let game = game_by_conn_id[conn_id];
    let player_id = player_id_by_conn_id[conn_id];
    let game_data = game_data_table[game.id];

    if (!game_data.performing_turn) {
        game_data.action_queue.push({
            action: 'stay',
            player_id: player_id
        });
        _check_for_turn_ready(game);
        return true;
    }

    return false;
}

/* Returns false only on tomfoolery */
function cancel_action(conn_id) {
    let game = game_by_conn_id[conn_id];
    let player_id = player_id_by_conn_id[conn_id];
    let game_data = game_data_table[game.id];

    if (!game_data.performing_turn) {
        for (let action of game_data.action_queue) {
            if (action.player_id === player_id) {
                game_data.action_queue.splice(game_data.action_queue.indexOf(action), 1);
                return true;
            }
        }
    }

    return false;
}


function check_for_next_state(conn_id) {
    let game = game_by_conn_id[conn_id];
    let game_data = game_data_table[game.id];

    if (game_data.next_state_ready) {
        let game_state = get_game_state(conn_id);
        game_data.num_players_received_state += 1;
        if (game_data.num_players_received_state === game.players.length) {
            // All players have received state
            game_data.performing_turn = false;
            game_data.next_state_ready = false;
            game_data.num_players_received_state = 0;
        }
        return game_state
    }

    return null
}


//This should pretty much remain the same when the real database is connected
module.exports = {
    create_room,
    join_room,
    start_game,

    check_if_game_started,
    get_game_state,
    
    move_player,
    stay_player,
    cancel_action,

    check_for_next_state
};