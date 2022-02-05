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

function _get_game_id() {
    return next_game_id++;
}

/* Returns true if game started, false if failed */
function start_game(conn_id) {
    for (let room of rooms) {
        if (room.players.includes(conn_id)) {
            let game = new Game(_get_game_id(), room.players.length);
            for (let player_id = 0; player_id < room.players.length; player_id++) {
                let player = room.players[player_id];
                game_by_conn_id[player] = game;
                player_id_by_conn_id[player] = player_id;
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


//This should pretty much remain the same when the real database is connected
module.exports = {
    create_room,
    join_room,
    start_game,

    check_if_game_started,
    get_game_state
};