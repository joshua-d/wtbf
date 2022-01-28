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
    constructor() {
        this.path = null;
    }

    //TODO refactor this
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

        this.beast = new Beast();
        this._generate_map(player_amt);
    }

    /* Generates map, beast path, and player start*/
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
                    this.player_start = player_start;
                    return;
                }
            }

        }

        console.log('Failure: was not able to generate viable map');
        this.map = new LocationMap(player_amt);
        this.beast.path = this.beast._generate_path(this.map);
        this.player_start = this.map.locations[Math.floor(Math.random() * this.map.locations.length)];

    }
}


module.exports = Game;