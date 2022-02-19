let LocationMap = require('./location-map.js');

//TODO do this better, config object
const lower_beast_path_percentage_bound = 0.25;
const upper_beast_path_percentage_bound = 0.4;
const min_distance_from_start_percentage = 0.1;
const max_beast_path_retrace_amount = 2;

const tries_before_failure = 50;

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

const min_beast_rampage = 1;
const max_beast_rampage = 3;


/*
Info:
{

}
 */


class Player {
    constructor(id, location) {
        this.id = id;
        this.location = location;
        this.prev_location = location;
        this.dead = false;
    }

    die() {
        this.dead = true;
    }
}


class Beast {
    constructor() {
        this.path = null;
        this.location = null;
        this.path_index = null;
    }

    //TODO refactor this - maybe put all logic in Game
    /* Generates and returns a potential beast path */
    _generate_path(map) {
        //TODO if rerolling maps becomes time consuming, consider rerolling beast start and length
        let beast_start = Math.floor(Math.random() * map.locations.length);

        let lower_length = Math.floor(lower_beast_path_percentage_bound * map.locations.length);
        let upper_length = Math.ceil(upper_beast_path_percentage_bound * map.locations.length);
        let length = lower_length + Math.floor(Math.random() * (upper_length - lower_length + 1));

        let beast_path_retrace_amount = 1 + Math.floor(Math.random() * (max_beast_path_retrace_amount + 1));

        let path = map.get_path_limited_retrace(beast_start, beast_start, length, beast_path_retrace_amount);

        if (path != null)
            path.pop();

        return path;
    }

}

class Game {
    constructor(id, player_amt) {
        this.id = id;
        this.map = null;
        this.player_start = null;

        this.players = [];
        this.beast = new Beast();
        this.ambushing = false;
        this.trapping = false;
        this.trap_location = null;
        this.visible_locations = [];

        this.day = 1;
        this.infos = {};
        this.visible_infos = {};
        this.num_info_locs = 0;
        this.can_die_anywhere = false;
        this.game_over = false;

        this.new_info_locs = [];

        this.messages = [];

        this._generate_map(player_amt);
        this._init_players(player_amt);
        this._init_infos();

        this.visible_locations.push(this.player_start);
        this._update_visible_locations();
    }

    /* Sets this.map, this.beast.path, this.beast.location, this.beast.path_index, and this.player_start
    *  Beast path cannot include player start
    */
    _generate_map(player_amt) {

        for (let i = 0; i < tries_before_failure; i++) {

            let map = new LocationMap(player_amt);
            let beast_path = this.beast._generate_path(map);

            if (beast_path == null) {
                continue;
            }

            let min_distance_from_start = Math.floor(min_distance_from_start_percentage * map.locations.length);

            for (
                let player_start = Math.floor(Math.random() * map.locations.length);
                player_start !== player_start - 1;
                player_start = (player_start + 1) % map.locations.length
            ) {

                if (beast_path.includes(player_start))
                    continue;

                let beast_start = beast_path[0];

                if (map.get_shortest_path_length(player_start, beast_start) >= min_distance_from_start) {
                    this.map = map;
                    this.beast.path = beast_path;
                    this.beast.location = beast_path[0];
                    this.beast.path_index = 0;
                    this.player_start = player_start;
                    return;
                }
            }

        }

        console.log('Failure: was not able to generate viable map');
        this.map = new LocationMap(player_amt);
        this.beast.path = this.beast._generate_path(this.map);
        this.beast.location = this.beast.path[0];
        this.beast.path_index = 0;
        this.player_start = this.map.locations[Math.floor(Math.random() * this.map.locations.length)];

    }

    /* Fills this.players with Players */
    _init_players(player_amt) {
        for (let player_id = 0; player_id < player_amt; player_id++) {
            this.players.push(new Player(player_id, this.player_start));
            this.map.locations[this.player_start].visited = true;
        }
    }

    /* Maps each location to an infos obj in this.infos and this.visible_infos */
    _init_infos() {
        for (let location of this.map.locations) {
            this.infos[location.id] = {
                footprints: [],
                aged_footprints: [],
                traces: [],
                markings: [], // markings don't need to be a list because there can only ever be one of each, but this makes things easier
                aged_markings: []
            };
            this.visible_infos[location.id] = {
                footprints: [],
                aged_footprints: [],
                traces: [],
                markings: [],
                aged_markings: [],
                info_present: false
            };
        }
    }

    /* Updates visible locations based on player locations */
    _update_visible_locations() {
        for (let player of this.players) {
            for (let connection of this.map.locations[player.location].connections) {
                if (!this.visible_locations.includes(connection)) {
                    this.visible_locations.push(connection);
                }
            }
        }
    }

    /* Rolls to generate info at beast's location */
    _generate_beast_info() {
        //TODO may be better to store more info in backend infos and have a parser for the frontend - we'll see!
        let leaves_footprint = Math.random() < footprint_chance;
        let leaves_trace = Math.random() < trace_chance;
        let footprint_age_visible = Math.random() < footprint_age_visible_chance;
        let footprint_direction_visible = Math.random() < footprint_direction_visible_chance;

        let loc_infos = this.infos[this.beast.location];

        if (leaves_footprint) {
            if (!footprint_direction_visible) {
                // Marking is a directionless footprint
                if (footprint_age_visible) {
                    loc_infos.aged_markings = [{
                        day_made: this.day,
                        day_found: null
                    }];
                }
                else {
                    loc_infos.markings = [{
                        day_found: null
                    }];
                }
            }
            else {
                let next_loc_ind = (this.beast.path_index + 1) % this.beast.path.length;
                let next_loc = this.beast.path[next_loc_ind];
                let new_footprint = {
                    direction: next_loc,
                    day_found: null
                };

                let fp_list;
                if (footprint_age_visible) {
                    fp_list = loc_infos.aged_footprints;
                    new_footprint.day_made = this.day;
                }
                else {
                    fp_list = loc_infos.footprints;
                }

                let replaced = false;
                for (let fp_idx = 0; fp_idx < fp_list.length; ++fp_idx) {
                    let footprint = fp_list[fp_idx];
                    if (footprint.direction === new_footprint.direction) {
                        fp_list[fp_idx] = new_footprint;
                        replaced = true;
                        break;
                    }
                }
                if (!replaced) {
                    fp_list.push(new_footprint);
                }
            }
        }

        if (leaves_trace) {
            let prev_loc_ind = this.beast.path_index - 1;
            if (prev_loc_ind === -1)
                prev_loc_ind = this.beast.path.length - 1;
            let prev_loc = this.beast.path[prev_loc_ind];
            let new_trace = {
                from: prev_loc,
                day_found: null
            };

            let replaced = false;
            for (let trace_idx = 0; trace_idx < loc_infos.traces.length; ++trace_idx) {
                let trace = loc_infos.traces[trace_idx];
                if (trace.from === new_trace.from) {
                    loc_infos.traces[trace_idx] = new_trace;
                    replaced = true;
                    break;
                }
            }
            if (!replaced) {
                loc_infos.traces.push(new_trace);
            }
        }
    }

    /* Calls _generate_beast_info to leave info at beast's location, moves beast to next location in path */
    _move_beast() {
        this._generate_beast_info();

        this.beast.path_index = (this.beast.path_index + 1) % this.beast.path.length;
        this.beast.location = this.beast.path[this.beast.path_index];
    }

    /* Beast rampages forward without leaving info - between min & max, then steps until not in a player's loc */
    _rampage_beast() {
        let rampage_len = min_beast_rampage + Math.floor((Math.random() * (max_beast_rampage - min_beast_rampage + 1)));
        let next_path_index = (this.beast.path_index + rampage_len) % this.beast.path.length;
        let next_location = this.beast.path[next_path_index];

        let player_locs = [];
        for (let player of this.players) {
            if (!player.dead) {
                player_locs.push(player.location);
            }
        }

        /*
        * TODO if, somehow, the players are lined up on the beast's entire path, he will have nowhere to go and this
        * will run forever. Num players can never be GTE beast path len
        */
        while (player_locs.includes(next_location)) {
            next_path_index = (this.beast.path_index + 1) % this.beast.path.length;
            next_location = this.beast.path[next_path_index];
        }

        this.beast.path_index = next_path_index;
        this.beast.location = next_location;
    }

    /* Updates this location's visible infos in this.visible_infos[location] - returns new info messages
    *  Also increments num_info_locs if necessary, and fills new_info_locs
    */
    _check_for_infos(location) {
        // this func is a little bit menkis
        let loc_infos = this.infos[location];
        let visible_loc_infos = this.visible_infos[location];

        let info_present_already = visible_loc_infos.info_present;

        if (!info_present_already) {
            this.visible_infos[location] = {
                footprints: [],
                aged_footprints: [],
                traces: [],
                markings: [],
                aged_markings: [],
                info_present: false
            };
        }

        let messages = [];

        for (let info_key of Object.keys(loc_infos)) {
            for (let info of loc_infos[info_key]) {
                visible_loc_infos[info_key].push(info);
                if (info.day_found == null) {
                    messages.push(this._info_message(info_key, info, location));
                    info.day_found = this.day;
                    if (!this.new_info_locs.includes(location))
                        this.new_info_locs.push(location);
                }
                visible_loc_infos.info_present = true;
            }
        }

        if (!info_present_already && visible_loc_infos.info_present) {
            ++this.num_info_locs;
        }

        return messages;
    }

    /* Returns whether or not a player can die at location right now
    *  Can die if X infos have been found, or this location has info present
    */
    _can_die(location) {
        return this.can_die_anywhere || this.visible_infos[location].info_present;
    }

    /* Returns whether or not the player with id can move to location
    *  Can't move if dead
    */
    can_move(id, location) {
        let player = this.players[id];
        return !player.dead && this.map.locations[player.location].connections.includes(location);
    }

    /* Moves player with id to location */
    move_player(id, location) {
        let player = this.players[id];
        player.prev_location = player.location;
        player.location = location;
    }


    /* Returns whether or not the players can ambush location */
    can_ambush(location) {
        for (let player of this.players) {
            if (player.location !== location && !this.map.locations[player.location].connections.includes(location)) {
                return false;
            }
        }
        return true;
    }

    /* Sets this.ambushing to true and this.trap_location to location */
    ambush(location) {
        this.ambushing = true;
        this.trap_location = location;
    }


    /* Returns whether or not the players can trap at location */
    can_trap(location) {
        for (let player of this.players) {
            if (player.location !== location) {
                return false;
            }
        }
        return true;
    }

    /* Sets this.trapping to true and this.trap_location to location */
    trap(location) {
        this.trapping = true;
        this.trap_location = location;
    }


    /* Moves beast, assumes players have moved to their location for the start of this turn, updates state */
    do_turn() {
        this.messages = [];

        this._move_beast();

        // Check for win/lose if trapping
        if (this.ambushing || this.trapping) { //TODO prob could combine to one var trapping
            if (this.beast.location === this.trap_location) {
                //Win
                console.log('win');
                this.messages.push('You won!');
                this.game_over = true;
                return;
            }
            else {
                //Fucking lose
                console.log('lose');
                this.messages.push('You lost!');
                this.game_over = true;
                return;
            }
        }

        // Check for beast encounters
        for (let player of this.players) {
            if (!player.dead && player.location === this.beast.location) {
                //Player has run into beast
                if (this._can_die(player.location)) {
                    //Player dies
                    player.die();
                    this._rampage_beast();
                    this.messages.push(this._player_death_message(player));
                }
                else {
                    //Player runs back to prev location
                    this.messages.push(this._beast_encounter_message(player));
                    let player_loc = player.location;
                    player.location = player.prev_location;
                    player.prev_location = player_loc;
                }
            }
            else if (!player.dead) {
                this.map.locations[player.location].visited = true;
            }
        }

        // Check for infos
        this.new_info_locs = [];
        for (let player of this.players) {
            if (!player.dead) {
                let loc_msgs = this._check_for_infos(player.location);
                for (let msg of loc_msgs)
                    this.messages.push(msg);
            }
        }

        this._update_visible_locations();

        //If can die anywhere is reached this turn, beast encounters have already been checked for - comes into effect next turn
        if (!this.can_die_anywhere && this.num_info_locs >= num_infos_before_death) {
            this.can_die_anywhere = true;
            this.messages.push(this._can_die_anywhere_msg());
        }
    }

    /* Returns locations mapped to their info objs of locations with newfound info (based on new_info_locs)
    *  Utility for efficient sending to FE
    */
    _get_info_updates() {
        let info_updates = {};
        for (let loc of this.new_info_locs) {
            info_updates[loc] = this.visible_infos[loc];
        }
        return info_updates;
    }

    /* Returns object representing full game state visible to players */
    get_full_state() {
        let state = {
            players: [],
            locations: [],
            player_start: this.player_start,
            messages: this.messages,
            game_over: this.game_over
        };

        for (let player of this.players) {
            state.players.push({
                id: player.id,
                location: player.location,
                dead: player.dead
            });
        }

        for (let loc_id of this.visible_locations) {
            let location = {};
            Object.assign(location, this.map.locations[loc_id]);
            location.info = this.visible_infos[loc_id];
            if (this.visible_infos[loc_id].info_present) {
                console.log(this.visible_infos[loc_id]);
            }
            state.locations.push(location);
        }

        return state;
    }

    /* Returns object containing player locations and info updates */
    get_updated_state() {
        let state = {
            players: [],
            info_updates: this._get_info_updates(),
            messages: this.messages
        };

        for (let player of this.players) {
            state.players.push({
                id: player.id,
                location: player.location,
                dead: player.dead
            });
        }

        return state;
    }

    _player_death_message(player) {
        return `Player ${player.id} has died at ${this.map.locations[player.location].name}. The beast tunnels forward!`;
    }

    _beast_encounter_message(player) {
        return `Player ${player.id} encountered the beast at ${this.map.locations[player.location].name}. Narrowly escaped!`;
    }

    _info_message(info_key, info, location) {
        if (info_key === 'aged_footprints') {
            return `You found a new footprint at ${this.map.locations[location].name}! It is heading toward ${this.map.locations[info.direction].name}. It is ${this.day - info.day_found} days old.`
        }
        else if (info_key === 'footprints') {
            return `You found a new footprint at ${this.map.locations[location].name}! It is heading toward ${this.map.locations[info.direction].name}. You could not determine its age...`;
        }
        else if (info_key === 'traces') {
            return `You found ${this.map.locations[info.from].trace} at ${this.map.locations[location].name}... The beast must have come from ${this.map.locations[info.from].name}!`;
        }
        else if (info_key === 'aged_markings') {
            return `You found a new marking at ${this.map.locations[location].name}! It is ${this.day - info.day_found} days old.`
        }
        else if (info_key === 'markings') {
            return `You found a new marking at ${this.map.locations[location].name}! You could not determine its age.`
        }
    }

    _can_die_anywhere_msg() {
        return `Info about the beast has been found at ${this.num_info_locs} locations! A rush of confidence sweeps over you...`;
    }

}


module.exports = Game;