const LocationMap = require('./location-map.js');

const lower_beast_path_percentage_bound = 0.25;
const upper_beast_path_percentage_bound = 0.4;
const min_distance_from_start_percentage = 0.1;
const max_beast_path_retrace_amount = 2;

const tries_before_failure = 100;

const footprint_chance = 0.5;
const trace_chance = 0.33;
const footprint_age_visible_chance = 0.5;
const footprint_direction_visible_chance = 0.5;

const beast_path_length_info_zone = 0.33;
const beast_step_info_zone = 0.66;
const beast_pattern_info_zone = 1;
const beast_path_length_info_variability = 5;
const beast_path_length_info_correct_chance = 0.5;
const beast_step_info_correct_chance = 0.5;
const beast_pattern_info_incorrect_range = 2;

const num_infos_before_death = 3;



class Player {
    constructor(game, id) {
        this.game = game;
        this.location = game.map.locations[0];
        this.infos = [];
        this.new_info_messages = [];
        this.id = id;
    }
    add_info(location) {

        if (location.info.footprints.length === 0 && location.info.traces.length === 0 && location.name !== "Village")
            return;

        //found first info
        if (location.info.footprints.length !== 0 || location.info.traces.length !== 0) {
            if (!this.game.can_die) {
                this.game.infos_found += 1;
                if (this.game.infos_found >= num_infos_before_death) {
                    for (let player of this.game.players) {
                        player.new_info_messages.push("Enough info about the beast was found! A rush of confidence sweeps over you.");
                    }
                }
            }
        }


        let infos = [];

        //Clone footprints
        for (let footprint of location.info.footprints) {
            if (footprint.new) {
                infos.push({
                    id: footprint.id,
                    location: location,
                    type: footprint.type,
                    age: footprint.age,
                    direction: footprint.direction,
                    age_visible: footprint.age_visible,
                    direction_visible: footprint.direction_visible
                });
                footprint.new = false;
            }
        }

        //Clone traces
        for (let trace of location.info.traces) {
            if (trace.new) {
                infos.push({
                    id: trace.id,
                    location: location,
                    type: trace.type,
                    trace: trace.trace,
                    from: trace.from
                });
                trace.new = false;
            }
        }

        //Village
        if (location.name === "Village") {
            infos.push({
                id: location.id + 'v',
                location: location,
                type: 'village_message',
                village_message: location.info.village_message
            });
        }

        //Replace or Add
        for (let info of infos) {

            let exists = false;

            for (let i = 0; i < this.infos.length; i++) {
                if (this.infos[i].id === info.id) {

                    exists = true;

                    //Replace existing info
                    info.message = this.parse_info(info);

                    //If info message is different, add new message and replace old info
                    if (info.message !== this.infos[i].message) {
                        this.new_info_messages.push(info.message);
                        for (let j = 0; j < this.game.collective_location_infos.length; j++) {
                            if (this.game.collective_location_infos[j].id === this.infos[i].id) {
                                this.infos[i] = info;
                                this.game.collective_location_infos[j] = info;

                                //Each player can find new info, end of turn info made not new
                                this.game.found_infos.push(info);

                                break;
                            }
                        }
                    }

                }
            }

            if (!exists) {

                info.message = this.parse_info(info);
                this.infos.push(info);

                this.new_info_messages.push(info.message);
                this.game.found_infos.push(info);

                let in_collective = false;
                for (let collective_info of this.game.collective_location_infos) {
                    if (collective_info.id === info.id)
                        in_collective = true;
                }
                if (!in_collective)
                    this.game.collective_location_infos.push(info);

            }


        }

    }
    parse_info(info) {
        let msg = "";
        if (info.type === 'footprint') {
            let footprint = info;
            if (footprint.age_visible) {
                if (footprint.direction_visible) {
                    msg = "You found a " + footprint.age + " day old footprint heading toward the " + footprint.direction.name;
                }
                else {
                    msg = "You found a " + footprint.age + " day old footprint"
                }
            }
            else if (footprint.direction_visible) {
                msg = "You found a footprint heading toward the " + footprint.direction.name;
            }
            else {
                msg = "You found a footprint";
            }
        }

        else if (info.type === 'trace') {
            let trace = info;
            msg = "You found " + trace.from.trace + "; something must have come from the " + trace.from.name;
        }

        else if (info.type === 'village_message') {
            msg = "The village people say: " + info.village_message;
            msg += "\nLegends are often based on rumors and may not always be true."
        }

        return msg;
    }
    get_new_info() {
        let new_info = [];
        for (let msg of this.new_info_messages)
            new_info.push(msg);
        this.new_info_messages = [];
        return new_info;
    }
    get_player_state() {

        //Make infos sendable
        let location_infos = [];
        for (let info of this.game.collective_location_infos) { //subject to change, only this players infos

            if (info.type === 'footprint') {
                let footprint = info;
                let new_footprint = {
                    location: footprint.location.id,
                    type: footprint.type,
                    age: footprint.age,
                    direction: footprint.direction.id,
                    age_visible: footprint.age_visible,
                    direction_visible: footprint.direction_visible
                };

                let exists = false;
                for (let existing_location of location_infos) {
                    if (existing_location.location === info.location.id) {
                        exists = true;
                        existing_location.infos.push(new_footprint);
                        break;
                    }
                }
                if (!exists)
                    location_infos.push({location: info.location.id, infos: [new_footprint]});

            }

            if (info.type === 'trace') {
                let trace = info;
                let new_trace = {
                    location: trace.location.id,
                    type: trace.type,
                    from: trace.from.id
                };

                let exists = false;
                for (let existing_location of location_infos) {
                    if (existing_location.location === info.location.id) {
                        exists = true;
                        existing_location.infos.push(new_trace);
                        break;
                    }
                }
                if (!exists)
                    location_infos.push({location: info.location.id, infos: [new_trace]});

            }

            /*
            if (info.type === 'village_message') {
                let village_message = info;
                let new_village_message = {
                    location: village_message.location.id,
                    type: village_message.type,
                    village_message: village_message.village_message
                };

                let exists = false;
                for (let existing_location of location_infos) {
                    if (existing_location.location === info.location.id) {
                        exists = true;
                        existing_location.infos.push(new_village_message);
                        break;
                    }
                }
                if (!exists)
                    location_infos.push({location: info.location.id, infos: [new_village_message]});

            }
            */

        }

        //Make other players sendable
        let players = [];
        for (let player of this.game.players) {
            players.push({
                location: player.location.id,
                id: player.id
            });
        }

        //testing
        let beast_path_str = "";
        for (let location of this.game.beast.path) {
            beast_path_str += location.name + '\n';
        }

        return {
            game_over: this.game.game_over,
            game_over_message: this.game.game_over_message,
            location_infos: location_infos,
            new_info_messages: this.get_new_info(),
            beast_location: this.game.beast.location.id,
            player_location: this.location.id,
            players: players,
            day: this.game.day,

            //testing:
            beast_path: beast_path_str
        };
    }
}

class Beast {
    constructor(start, path) {
        this.start = start;
        this.path = path;
        this.path_length = path.length;
        this.location = start;
        this.path_index = 0;
    }
    move() {
        this.path_index = (this.path_index + 1) % this.path_length;
        this.location = this.path[this.path_index];
    }
    get_next() {
        return this.path[(this.path_index + 1) % this.path_length];
    }
    get_previous() {
        let prev = this.path_index - 1;
        if (prev === -1)
            prev = this.path_length - 1;
        return this.path[prev];
    }
}

class Game {
    constructor(player_amt, id) {
        this.map = new LocationMap(player_amt);
        this.player_amt = player_amt;
        this.id = id;

        this.action_queue = [];

        this.collective_location_infos = [];
        this.found_infos = [];

        this.vote = null;
        this.votes = [];

        this.player_start = this.map.locations[0];

        this.min_distance_from_start = Math.floor(min_distance_from_start_percentage * this.map.location_amt);

        this.day = 1;

        this.can_die = false;
        this.infos_found = 0;

        this.game_over = false;
        this.game_over_message = null;

        this.init_players();
        this.init_beast();
        this.generate_village_info();

    }

    init_beast() {

        let beast_start = this.map.locations[Math.floor(Math.random() * this.map.location_amt)];
        let distance = this.map.get_shortest_path(this.player_start, beast_start).length - 1;

        for (let i = 0; distance < this.min_distance_from_start && i < tries_before_failure; i++) {
            beast_start = this.map.locations[Math.floor(Math.random() * this.map.location_amt)];
            distance = this.map.get_shortest_path(this.player_start, beast_start).length - 1;
        }

        if (distance < this.min_distance_from_start) {
            console.log("Failure: could not get beast starting location over min distance from start");
        }

        let lower = Math.floor(lower_beast_path_percentage_bound * this.map.location_amt);
        let upper = Math.ceil(upper_beast_path_percentage_bound * this.map.location_amt);
        let length = lower + Math.floor(Math.random() * (upper - lower + 1));

        let beast_path_retrace_amount = Math.floor(Math.random() * (max_beast_path_retrace_amount + 1));

        let path = this.map.get_path(beast_start, beast_start, length, beast_path_retrace_amount);
        for (let i = 0; path[0] == null && i < tries_before_failure; i++) {
            path = this.map.get_path(beast_start, beast_start, length, beast_path_retrace_amount);
        }

        if (path[0] == null) {
            console.log("Failure: could not get beast path");
        }

        path.pop();
        this.beast = new Beast(beast_start, path);

        console.log(this.beast.path);

    }

    init_players() {
        this.players = [];
        for (let i = 0; i < this.player_amt; i++) {
            this.players.push(new Player(this, i));
        }
    }

    generate_info() {

        //Footprint
        if (Math.random() < footprint_chance) {

            let new_footprint = {
                id: this.beast.location.id + 'f' + this.beast.get_next().id,
                location: this.beast.location,
                type: 'footprint',
                age: 1,
                direction: this.beast.get_next(),
                age_visible: Math.random() < footprint_age_visible_chance,
                direction_visible: Math.random() < footprint_direction_visible_chance,
                new: true
            };

            if (this.beast.location.info.footprints.length > 0) {
                let exists = false;
                for (let footprint of this.beast.location.info.footprints) {

                    //Replace if same direction

                    if (footprint.direction === new_footprint.direction) {
                        exists = true;
                        footprint.age = 1;
                        if (new_footprint.age_visible) {
                            footprint.age_visible = true;
                        }
                        if (new_footprint.direction_visible) {
                            footprint.direction_visible = true;
                        }
                        footprint.new = true;
                        break;
                    }

                }
                if (!exists) {
                    this.beast.location.info.footprints.push(new_footprint);
                }
            }
            else {
                this.beast.location.info.footprints.push(new_footprint);
            }

            this.beast.location.info.new = true;

        }

        //Trace
        if (Math.random() < trace_chance) {
            let new_trace = {
                id: this.beast.location.id + 't' + this.beast.get_previous().id,
                location: this.beast.location,
                type: 'trace',
                trace: this.beast.get_previous().trace,
                from: this.beast.get_previous(),
                new: true
            };
            if (this.beast.location.info.traces.length > 0) {
                let exists = false;
                for (let trace of this.beast.location.info.traces) {
                    //Replace if same origin
                    if (trace.from === new_trace.from) {
                        exists = true;
                        trace.new = true;
                        break;
                    }
                }
                if (!exists) {
                    this.beast.location.info.traces.push(new_trace);
                }
            }
            else {
                this.beast.location.info.traces.push(new_trace);
            }

            this.beast.location.info.new = true;

        }

    }

    generate_village_info() {
        for (let location of this.map.locations) {
            if (location.name === "Village") {

                let info_type = Math.random();

                //Beast path length
                if (info_type < beast_path_length_info_zone) {

                    //Right steps till step back home
                    //Wrong different amount of steps

                    let path_length = this.beast.path_length - beast_path_length_info_variability + (Math.floor(Math.random() * (beast_path_length_info_variability*2 + 1)));
                    if (Math.random() < beast_path_length_info_correct_chance) {
                        path_length = this.beast.path_length;
                    }
                    location.info.village_message = "Legend says the beast travels " + (path_length - 1) + " locations before returning to its start.";
                    location.info.new = true;
                }
                else if (info_type < beast_step_info_zone) {

                    //Right: from to
                    //Wrong switched, to from

                    let from = Math.floor(Math.random() * this.beast.path_length);
                    let to = (from + 1) % this.beast.path_length;
                    if (Math.random() > beast_step_info_correct_chance) {
                        let temp = from;
                        from = to;
                        to = temp;
                    }
                    location.info.village_message = "Legend says the beast moves from the " + this.beast.path[from].name.toLowerCase() + " to the " + this.beast.path[to].name.toLowerCase() + ".";
                    location.info.new = true;
                }
                else if (info_type < beast_pattern_info_zone) {

                    //Right number of times location appears in path
                    //Wrong wrong location and wrong number

                    let count_map = new Map();
                    for (let location of this.beast.path) {
                        if (count_map.has(location.id)) {
                            count_map.set(location.id, count_map.get(location.id) + 1);
                        }
                        else {
                            count_map.set(location.id, 1);
                        }
                    }
                    for (let id of count_map.keys()) {
                        if (count_map.get(id) > 1) {
                            location.info.village_message = "Legend says the beast passes through the " + this.map.locations[id].name.toLowerCase() + " " + count_map.get(id) + " times in its path.";
                            location.info.new = true;
                            console.log(location.info.village_message);
                            return;
                        }
                    }
                    location.info.village_message = "Legend says the beast passes through the " + this.map.locations[Math.floor(Math.random() * this.map.location_amt)].name.toLowerCase() + " " + (2 + Math.floor(Math.random() * beast_pattern_info_incorrect_range + 1)) + " times in its path.";
                    location.info.new = true;
                }

                console.log(location.info.village_message);
            }
        }
    }

    update_info() {
        for (let location of this.map.locations) {
            for (let footprint of location.info.footprints) {
                footprint.age++;
            }
        }
        for (let info of this.collective_location_infos) {
            if (info.type === 'footprint') {
                let footprint = info;
                footprint.age++;
            }
        }
    }

    clear_found_infos() {
        for (let info of this.found_infos) {
            info.location.info.new = false;
        }
        this.found_infos = [];
    }

    check_first_info() {
        if (this.infos_found >= num_infos_before_death)
            this.can_die = true;
    }

    get_game_state() {

        //Make locations sendable
        let locations = [];
        for (let location of this.map.locations) {
            let connections = [];
            for (let connection of location.connections) {
                connections.push(connection.id);
            }
            locations.push({
                name: location.name,
                id: location.id,
                position: location.position,
                connections: connections
            });
        }

        //Make collective_location_infos sendable
        let collective_location_infos = [];
        for (let info of this.collective_location_infos) {

            let footprints = [];
            for (let footprint of info.footprints) {
                let new_footprint = {
                    type: footprint.type,
                    age: footprint.age,
                    direction: footprint.direction.id,
                    age_visible: footprint.age_visible,
                    direction_visible: footprint.direction_visible
                };
                footprints.push(new_footprint);
            }

            let traces = [];
            for (let trace of info.traces) {
                let new_trace = {
                    type: trace.type,
                    from: trace.from.id
                };
                traces.push(new_trace);
            }

            infos.push({
                location: info.location.id,
                footprints: footprints,
                traces: traces
            });

        }

        //Make players sendable
        let players = [];
        for (let player of this.players) {
            players.push({
                location: player.location.id,
                id: player.id
            });
        }

        return {
            locations: locations,
            beast_location: locations[this.beast.location.id],
            players: players,
            collective_location_infos: collective_location_infos,
            day: this.day
        };
    }

    turn() {
        this.update_info();
        this.generate_info();
        this.beast.move();

        this.do_actions();

        this.clear_found_infos();
        this.check_first_info();

        this.day++;

        //console.log(this.beast.path);
        //console.log(this.beast.path[this.beast.path_index]);
        //console.log(this.collective_location_infos);
        //send game state
    }

    action(action) {
        if (action == null)
            return;

        if (action.type === "move") {
            let player = this.players[action.player_id];

            let old_location = player.location;

            //security check
            if (player.location.connections.indexOf(this.map.locations[action.location]) >= 0) {
                player.location = this.map.locations[action.location];

                if (this.map.locations[action.location].info.new)
                    player.add_info(this.map.locations[action.location]);

            }
            else {
                //error, invalid action
            }

            //Check game over
            if (player.location === this.beast.location) {
                if (!this.can_die) {
                    player.new_info_messages.push("You saw the beast while approaching the " + player.location.name + ", and got away safely!");
                    player.location = old_location;
                }
                else {
                    this.game_over = true;
                    this.game_over_message = "Game over: Player " + player.id + " was killed by the beast at the " + player.location.name + ".";
                }
            }

        }

        else if (action.type === 'stay') {
            let player = this.players[action.player_id];
            if (player.location === this.beast.location) {
                this.game_over = true;
                this.game_over_message = "Game over: Player " + player.id + " was killed by the beast at the " + player.location.name + ".";
            }
        }

        else if (action.type === "ambush") {

            //security check
            let ambush_locations = [];
            for (let location of this.players[0].location.connections)
                ambush_locations.push(location);
            ambush_locations.push(this.players[0].location);
            for (let player of this.players) {
                for (let i = 0; i < ambush_locations.length; i++) {
                    let connection = ambush_locations[i];
                    if (player.location.connections.indexOf(connection) < 0 && connection !== player.location) {
                        let index = ambush_locations.indexOf(connection);
                        ambush_locations.splice(index, 1);
                        if (index <= i)
                            i--;
                    }
                }
            }

            //TODO these indexOfs might not work
            if (ambush_locations.indexOf(this.map.locations[action.location]) < 0) {
                //error, invalid action
                return;
            }

            this.game_over = true;
            if (action.location === this.beast.location.id) {
                this.game_over_message = "You successfully ambushed the beast at the " + this.map.locations[action.location].name + "!";
            }
            else {
                this.game_over_message = "Game over: You did not successfully ambush the beast at the " + this.map.locations[action.location].name + ". The beast was at the " + this.beast.location.name + ".";
            }
        }

        else if (action.type === 'trap') {

            //security check
            for (let player of this.players) {
                if (player.location.id !== action.location) {
                    //error, invalid action
                    return;
                }
            }

            this.game_over = true;
            if (action.location === this.beast.location.id) {
                this.game_over_message = "You successfully trapped the beast at the " + this.map.locations[action.location].name + "!";
            }
            else {
                this.game_over_message = "Game over: You did not successfully trap the beast at the " + this.map.locations[action.location].name + ". The beast was at the " + this.beast.location.name + ".";
            }
        }

        if (this.game_over)
            console.log(this.beast.path);
    }

    do_actions() {
        for (let action of this.action_queue) {
            this.action(action);
        }
        this.action_queue = [];
    }

    vote_result() {
        let yes = 0;
        let no = 0;
        for (let vote of this.votes) {
            if (vote)
                yes++;
            else
                no++;
        }

        this.votes = [];

        if (yes > no) {
            this.action_queue = [this.vote];
            this.turn();
        }

        this.vote = null;

        return yes > no;
    }

}

module.exports = {
    Game: Game,
    Player: Player
};

/*
var game = new Game(3);

console.log(game.beast.location);
game.turn();
game.action([{
    type: 'move',
    player_id: 0,
    location: game.beast.start
}]);
*/

/*
//test retrace
for (let i = 0; i < 1; i++) {
    console.log(i);
    let retrace_amt = 2;
    var path = game.map.get_path(game.map.locations[0], game.map.locations[0], 20, retrace_amt);


    console.log(game.map.locations[0]);
    console.log(game.map.locations[1]);
    console.log(path);


    let loc_map = new Map();
    for (let j = 0; j < path.length; j++) {
        if (loc_map.has(path[j].id)) {
            loc_map.set(path[j].id, loc_map.get(path[j].id) + 1);
        }
        else {
            loc_map.set(path[j].id, 1);
        }
    }

    let count = 0;
    for (let j = 0; j < path.length; j++) {
        count += loc_map.get(path[j].id) - 1;
    }
    if (count > retrace_amt) {
        console.log("failed " + count);
        break;
    }

}
*/
