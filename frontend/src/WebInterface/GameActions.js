import reqs from "./requests.js";
import { IsGameStartedChecker } from './Checkers.js';


function check_for_game_started(conn_id, callback) {
    let checker = new IsGameStartedChecker(conn_id, callback);
    checker.start();
}

async function get_initial_game_state(conn_id) {
    let game_state = await reqs.request(`/game/initial-game-state?conn_id=${conn_id}`);
    return game_state;
}


export default {
    check_for_game_started,
    get_initial_game_state
}