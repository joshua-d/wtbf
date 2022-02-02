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

    rampage() {
        let rampage_len = min_beast_rampage + Math.floor((Math.random() * (max_beast_rampage - min_beast_rampage + 1)));
        this.path_index = this.path_index + (rampage_len % this.path.length);
        this.location = this.path[this.path_index];
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
        this.can_die = false;
        this.num_info_locs = 0;

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
        }
    }

    /* Maps each location to an infos obj in this.infos and this.visible_infos */
    _init_infos() {
        for (let location of this.map.locations) {
            this.infos[location.id] = {
                footprints: [],
                traces: [],
                markings: []
            };
            this.visible_infos[location.id] = {
                footprints: [],
                traces: [],
                markings: []
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
        let leaves_footprint = Math.random() < footprint_chance;
        let leaves_trace = Math.random() < trace_chance;
        let footprint_age_visible = Math.random() < footprint_age_visible_chance;
        let footprint_direction_visible = Math.random() < footprint_direction_visible_chance;

        let loc_infos = this.infos[this.beast.location];

        if (leaves_footprint) {
            if (!footprint_direction_visible) {
                // Marking is a directionless footprint
                let new_marking = {
                    day_made: this.day,
                    age_visible: footprint_age_visible,
                    found: false
                };

                // New marking replaces existing marking in same category - age visible or age not visible
                let replaced = false;
                for (let marking_idx = 0; marking_idx < loc_infos.markings.length; ++marking_idx) {
                    let marking = loc_infos.markings[marking_idx];
                    if (marking.age_visible === footprint_age_visible) {
                        loc_infos.markings[marking_idx] = new_marking;
                        replaced = true;
                        break;
                    }
                }
                if (!replaced) {
                    loc_infos.markings.push(new_marking);
                }
            }
            else {
                let next_loc_ind = (this.beast.path_index + 1) % this.beast.path.length;
                let next_loc = this.beast.path[next_loc_ind];
                let new_footprint = {
                    day_made: this.day,
                    direction: next_loc,
                    age_visible: footprint_age_visible,
                    found: false
                };

                let replaced = false;
                for (let fp_idx = 0; fp_idx < loc_infos.footprints.length; ++fp_idx) {
                    let footprint = loc_infos.footprints[fp_idx];
                    if (footprint.direction === new_footprint.direction) {
                        loc_infos.footprints[fp_idx] = new_footprint;
                        replaced = true;
                        break;
                    }
                }
                if (!replaced) {
                    loc_infos.footprints.push(new_footprint);
                }
            }
        }

        if (leaves_trace) {
            let prev_loc_ind = this.beast.path_index - 1;
            if (prev_loc_ind === -1)
                prev_loc_ind = this.beast.path.length - 1;
            let prev_loc = this.beast.path(prev_loc_ind);
            let new_trace = {
                day_made: this.day,
                from: prev_loc,
                found: false
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
    _do_turn() {
        this._move_beast();

        if (this.ambushing || this.trapping) { //TODO prob could combine to one var trapping
            if (this.beast.location === this.trap_location) {
                //Win

                return;
            }
        }

        for (let player of this.players) {
            if (!player.dead && player.location === this.beast.location) {
                //Player has run into beast
                if (this.can_die) {
                    player.die();
                    this.beast.rampage();
                }
            }
        }

    }

}


module.exports = Game;