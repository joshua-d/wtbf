
//TODO you maybe be able to see direction and age of footprints through console
let locations;
let players;
let player_id;
let location_infos;
let day;

let can_trap = false;
let can_ambush = false;
let ambush_locations;

let action;


function init_state(game_state, player) {
    locations = game_state.locations;
    for (let location of locations) {
        location.visible = false;
        location.visited = false;
    }
    players = game_state.players;
    player_id = player;
    day = game_state.day;
    update_day();

    locations[0].visible = true;
    for (let id of locations[0].connections) {
        locations[id].visible = true;
    }
}

function update_state(player_state) {

    //Check for game over
    if (player_state.game_over) {
        alert(player_state.game_over_message);
        console.log(locations[player_state.beast_location].name);
    }

    //Move players
    for (let i = 0; i < players.length; i++) {
        players[i].location = player_state.players[i].location;
        locations[players[i].location].visible = true;
        for (let id of locations[players[i].location].connections) {
            locations[id].visible = true;
        }
    }

    //Check for trap and ambush
    let same_location = true;
    let location = players[0].location;
    for (let player of players) {
        if (player.location !== location) {
            same_location = false;
        }
    }

    ambush_locations = [];
    for (let location of locations[players[0].location].connections)
        ambush_locations.push(location);
    ambush_locations.push(players[0].location);
    for (let player of players) {
        for (let i = 0; i < ambush_locations.length; i++) {
            let connection = ambush_locations[i];
            if (locations[player.location].connections.indexOf(connection) < 0 && connection !== player.location) {
                let index = ambush_locations.indexOf(connection);
                ambush_locations.splice(index, 1);
                if (index <= i)
                    i--;
            }
        }
    }
    

    can_trap = same_location;
    can_ambush = ambush_locations.length > 0;


    //Get infos
    location_infos = player_state.location_infos;
    console.log(location_infos);
    let msg_str = "";
    for (let msg of player_state.new_info_messages) {
        msg_str += msg + "\n"
    }

    day = player_state.day;

    action = null;

    //Reset controls
    show_message(msg_str);
    show_locations();
    show_info();
    show_main_controls();
    update_day();
}

function move(location) {
    action = {
        type: 'move',
        player_id: player_id,
        location: location.id
    };
}

function stay() {
    action = {
        type: 'stay',
        player_id: player_id,
    }
}

function ambush(location) {
    action = {
        type: 'ambush',
        player_id: player_id,
        location: location.id
    };
}

function trap() {
    action = {
        type: 'trap',
        player_id: player_id,
        location: players[player_id].location
    };
}