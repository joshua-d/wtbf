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

//const num_infos_before_death = 3; // removed this functionality

const min_beast_rampage = 1;
const max_beast_rampage = 3;

const max_beast_single_loc_steps = max_beast_path_retrace_amount + 1;
const beast_path_length_village_variability = 5;
const village_call_wrong_chance = 0.5;


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
        this.village_infos = {};
        this.num_info_locs = 0;
        this.game_over = false;

        this.new_info_locs = [];

        this.messages = [];

        this._generate_map(player_amt);
        this._init_players(player_amt);
        this._init_infos();
        this._init_village_infos();

        this.visible_locations.push(this.player_start);
        this._update_visible_locations();

        console.log('Village infos:');
        console.log(this.village_infos);

        console.log('\nBeast path:');
        for (let loc of this.beast.path) {
            console.log(this.map.locations[loc].name);
        }
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

    /* Generates village info and populates this.village_infos */
    _init_village_infos() {
        let village_ids = [];
        for (let loc of this.map.locations) {
            if (loc.is_village) {
                village_ids.push(loc.id);
            }
        }

        let called_wrong_by = {};
        let call_wrong = {};

        for (let vil_id of village_ids) {
            if (Math.random() < village_call_wrong_chance && village_ids.length > 1) {
                // Choose a village to call you wrong
                let caller_idx;
                do {
                    caller_idx = Math.floor(Math.random() * village_ids.length);
                }
                while (caller_idx === village_ids.indexOf(vil_id));
                called_wrong_by[vil_id] = village_ids[caller_idx];
                call_wrong[village_ids[caller_idx]] = vil_id;
            }
            else
                called_wrong_by[vil_id] = null;
        }

        for (let vil_id of village_ids) {
            if (vil_id in call_wrong) {
                this.village_infos[vil_id] = `${this.map.locations[vil_id].name}: The word of ${this.map.locations[call_wrong[vil_id]].name} can't be trusted!`;
            }
            else {
                // Figure out if you are wrong
                let wrong = false;
                let next_caller = called_wrong_by[vil_id];
                while (next_caller != null && called_wrong_by[next_caller] !== vil_id) { // second case prevents inf loop if call each other wrong
                    next_caller = called_wrong_by[next_caller];
                    wrong = !wrong;
                }

                // TODO wrong villages coooould be right about something
                // Roll for info
                let roll = Math.random();

                if (roll < 0.25) {
                    // Beast step info
                    let step_loc;
                    if (wrong)
                        step_loc = this.map.locations[Math.floor(Math.random() * this.map.locations.length)];
                    else
                        step_loc = this.map.locations[this.beast.path[Math.floor(Math.random() * this.beast.path.length)]];

                    this.village_infos[vil_id] = `${this.map.locations[vil_id].name}: Legend says the beast travels through ${step_loc.name}.`;
                }
                else if (roll < 0.50) {
                    // Beast step & amt info
                    let step_loc;
                    let step_amt;
                    if (wrong) {
                        step_loc = this.map.locations[Math.floor(Math.random() * this.map.locations.length)];
                        step_amt = 1 + Math.floor(Math.random() * max_beast_single_loc_steps); // between 1 and max
                    }
                    else {
                        let multiple_touch_ids = [];
                        for (let loc_id of this.beast.path) {
                            let count = 0;
                            for (let comp_loc_id of this.beast.path) {
                                if (comp_loc_id === loc_id)
                                    ++count;
                            }
                            if (count > 1)
                                multiple_touch_ids.push({id: loc_id, count: count});
                        }
                        if (multiple_touch_ids.length > 0) {
                            let step_loc_mt = multiple_touch_ids[Math.floor(Math.random() * multiple_touch_ids.length)];
                            step_loc = this.map.locations[step_loc_mt.id];
                            step_amt = step_loc_mt.count;
                        }
                        else {
                            step_loc = this.map.locations[this.beast.path[Math.floor(Math.random() * this.beast.path.length)]];
                            step_amt = 1;
                        }
                    }

                    this.village_infos[vil_id] = `${this.map.locations[vil_id].name}: Legend says the beast travels through ${step_loc.name} ${step_amt} times.`;
                }
                else if (roll < 0.75) {
                    // Beast path length info
                    let path_length = this.beast.path.length;
                    if (wrong) {
                        if (Math.random() > 0.5)
                            path_length += 1 + Math.floor(Math.random() * beast_path_length_village_variability);
                        else
                            path_length -= 1 + Math.floor(Math.random() * beast_path_length_village_variability);
                    }
                    this.village_infos[vil_id] = `${this.map.locations[vil_id].name}: Legends says the beast returns to its start every ${path_length} days.`;
                }
                else {
                    // Beast move info
                    let from;
                    let to;
                    if (wrong) {
                        from = this.map.locations[Math.floor(Math.random() * this.map.locations.length)];
                        to = this.map.locations[from.connections[Math.floor(Math.random() * from.connections.length)]];
                    }
                    else {
                        let from_idx = Math.floor(Math.random() * this.beast.path.length);
                        let to_idx = (from_idx + 1) % this.beast.path.length;
                        from = this.map.locations[this.beast.path[from_idx]];
                        to = this.map.locations[this.beast.path[to_idx]];
                    }
                    this.village_infos[vil_id] = `${this.map.locations[vil_id].name}: Legend says the beast moves from ${from.name} to ${to.name}.`;
                }
            }
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
    // TODO henry edit - rampage goes to random loc in path
    _rampage_beast() {
        let next_path_index = Math.floor(Math.random() * this.beast.path.length);
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
            next_path_index = Math.floor(Math.random() * this.beast.path.length);
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
        let info_present_already = this.visible_infos[location].info_present;

        if (info_present_already) {
            //Clear to prepare for copying
            this.visible_infos[location] = {
                footprints: [],
                aged_footprints: [],
                traces: [],
                markings: [],
                aged_markings: [],
                info_present: true
            };
        }

        let visible_loc_infos = this.visible_infos[location];

        let messages = [];

        // Copy infos from this.infos[loc] to this.visible_infos[loc]
        for (let info_key of Object.keys(loc_infos)) {
            for (let info of loc_infos[info_key]) {
                visible_loc_infos[info_key].push(info);

                if (info.day_found == null) {
                    // This is a new info, add a msg and mark day found
                    messages.push(this._info_message(info_key, info, location));
                    info.day_found = this.day;

                    //Util for marking which locs have new info
                    if (!this.new_info_locs.includes(location))
                        this.new_info_locs.push(location);
                }

                visible_loc_infos.info_present = true;
            }
        }

        if (!info_present_already && visible_loc_infos.info_present) {
            ++this.num_info_locs;
        }

        // Check for village info
        // TODO msg will be added for each player there, too lazy to fix
        if (this.map.locations[location].is_village) {
            messages.push(this.village_infos[location]);
        }

        return messages;
    }

    /* Returns whether or not a player can die at location right now
    *  Can die if this location has info present
    */
    _can_die(location) {
        return this.visible_infos[location].info_present;
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
            if (!player.dead && player.location !== location && !this.map.locations[player.location].connections.includes(location)) {
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
            if (!player.dead && player.location !== location) {
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
        console.log('Beast loc:');
        console.log(this.map.locations[this.beast.location].name);

        ++this.day;

        // Check for win/lose if trapping
        if (this.ambushing || this.trapping) { //TODO prob could combine to one var trapping
            if (this.beast.location === this.trap_location) {
                //Win
                console.log('win');
                this.messages.push('You won!');
                this.game_over = true;
            }
            else {
                //Fucking lose
                console.log('lose');
                this.messages.push('You lost!');
                this.game_over = true;
            }
            this.messages.push(this._beast_location_message());
            this.messages.push(this._beast_path_message());
            return;
        }

        // Check for beast encounters
        let should_rampage = false;
        for (let player of this.players) {
            if (!player.dead && player.location === this.beast.location) {
                //Player has run into beast
                if (this._can_die(player.location)) {
                    //Player dies
                    player.die();
                    should_rampage = true;
                    this.messages.push(this._player_death_message(player));
                }
                else {
                    //Player runs back to prev location
                    this.messages.push(this._beast_encounter_message(player));
                    let player_loc = player.location;
                    player.location = player.prev_location;
                    player.prev_location = player_loc;
                    should_rampage = true;
                }
            }
            else if (!player.dead) {
                this.map.locations[player.location].visited = true;
            }
        }
        if (should_rampage) {
            this._rampage_beast();
            console.log('Beast rampaged, new loc:');
            console.log(this.map.locations[this.beast.location].name);
        }

        // Check for all players dead
        let all_players_dead = true;
        for (let player of this.players) {
            if (!player.dead) {
                all_players_dead = false;
                break;
            }
        }
        if (all_players_dead) {
            //Fucking lose
            console.log('lose');
            this.messages.push('You lost!');
            this.game_over = true;
            this.messages.push(this._beast_location_message());
            this.messages.push(this._beast_path_message());
            return;
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
            game_over: this.game_over,
            day: this.day
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
            return `You found a new footprint at ${this.map.locations[location].name}! It is heading toward ${this.map.locations[info.direction].name}. It is ${this.day - info.day_made} days old.`
        }
        else if (info_key === 'footprints') {
            return `You found a new footprint at ${this.map.locations[location].name}! It is heading toward ${this.map.locations[info.direction].name}. You could not determine its age...`;
        }
        else if (info_key === 'traces') {
            return `You found ${this.map.locations[info.from].trace} at ${this.map.locations[location].name}... The beast must have come from ${this.map.locations[info.from].name}!`;
        }
        else if (info_key === 'aged_markings') {
            return `You found a new marking at ${this.map.locations[location].name}! It is ${this.day - info.day_made} days old.`
        }
        else if (info_key === 'markings') {
            return `You found a new marking at ${this.map.locations[location].name}! You could not determine its age.`
        }
    }

    _can_die_anywhere_msg() {
        return `Info about the beast has been found at ${this.num_info_locs} locations! A rush of confidence sweeps over you...`;
    }

    _beast_path_message() {
        let path_str = "The beast's path: ";
        for (let loc_id of this.beast.path) {
            path_str += this.map.locations[loc_id].name + ', '
        }
        path_str = path_str.substring(0, path_str.length - 2);
        return path_str;
    }

    _beast_location_message() {
        return `The beast's location: ${this.map.locations[this.beast.location].name}`;
    }

}


module.exports = Game;