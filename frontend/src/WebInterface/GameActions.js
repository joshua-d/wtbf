import reqs from "./requests.js";
import { IsGameStartedChecker } from './Checkers.js';


function check_for_game_started(conn_id, callback) {
    let checker = new IsGameStartedChecker(conn_id, callback);
    checker.start();
}

async function get_initial_game_state(conn_id) {
    let res = await reqs.request(`/game/initial-game-state?conn_id=${conn_id}`);
    return res.data;
}


export default {
    check_for_game_started,
    get_initial_game_state
}