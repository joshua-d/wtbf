let LocationMap = require('./location-map.js');

//TODO do this better, config object
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


/*
Info:
{

}
 */


class Player {
    constructor(game, id) {
        this.game = game;
        this.id = id;

        this.location = null;
        this.found_infos = [];
    }
}

class Beast {
    constructor(map, player_start, min_distance_from_start) {
        this.path =this._generate_path(map, player_start, min_distance_from_start);
        this.location = this.path[0];
    }

    //TODO refactor this
    _generate_path(map, player_start, min_distance_from_start) {
        let beast_start = Math.floor(Math.random() * map.locations.length);
        let distance = map.get_shortest_path(player_start, beast_start).length - 1;

        for (let i = 0; distance < min_distance_from_start && i < tries_before_failure; i++) {
            beast_start = Math.floor(Math.random() * map.locations.length);
            distance = map.get_shortest_path(player_start, beast_start).length - 1;
        }

        if (distance < min_distance_from_start) {
            console.log("Failure: could not get beast starting location over min distance from start");
        }

        let lower = Math.floor(lower_beast_path_percentage_bound * map.locations.length);
        let upper = Math.ceil(upper_beast_path_percentage_bound * map.locations.length);
        let length = lower + Math.floor(Math.random() * (upper - lower + 1));

        let beast_path_retrace_amount = Math.floor(Math.random() * (max_beast_path_retrace_amount + 1));

        let path = map.get_path(beast_start, beast_start, length, beast_path_retrace_amount);
        for (let i = 0; path[0] == null && i < tries_before_failure; i++) {
            path = map.get_path(beast_start, beast_start, length, beast_path_retrace_amount);
        }

        if (path[0] == null) {
            console.log("Failure: could not get beast path");
        }

        path.pop();
        return path;
    }
}

class Game {
    constructor(id, player_amt) {
        this.id = id;
        this.map = new LocationMap(player_amt);

        this.player_start = 0;

        this.min_distance_from_start = Math.floor(min_distance_from_start_percentage * this.map.locations.length);
        this.beast = new Beast(this.map, this.player_start, this.min_distance_from_start);
    }
}


module.exports = Game;