import reqs from "./requests.js";
import { IsGameStartedChecker, GetNextStateChecker, VotesChecker } from './Checkers.js';
import {IsPerformingTurnChecker} from "./Checkers";


function check_for_game_started(conn_id, callback) {
    let checker = new IsGameStartedChecker(conn_id, callback);
    checker.start();
}

async function get_initial_game_state(conn_id) {
    let res = await reqs.request(`/game/initial-game-state?conn_id=${conn_id}`);
    return res.data;
}

async function move(conn_id, loc_id) {
    let res = await reqs.request('/game/move-player', 'POST', {conn_id: conn_id, loc_id: loc_id});
    return reqs.successful(res);
}

async function stay(conn_id) {
    let res = await reqs.request('/game/stay-player', 'POST', {conn_id: conn_id});
    return reqs.successful(res);
}

async function cancel_action(conn_id) {
    let res = await reqs.request('/game/cancel-action', 'POST', {conn_id: conn_id});
    return reqs.successful(res);
}

function get_next_state(conn_id, callback) {
    let checker = new GetNextStateChecker(conn_id, callback);
    checker.start();
}

function check_if_performing_turn(conn_id, callback) {
    let checker = new IsPerformingTurnChecker(conn_id, callback);
    checker.start();
}

async function vote(conn_id, loc_id) {
    let res = await reqs.request('/game/vote', 'POST', {conn_id: conn_id, loc_id: loc_id});
    return reqs.successful(res);
}

async function cancel_vote(conn_id) {
    let res = await reqs.request('/game/cancel-vote', 'POST', {conn_id: conn_id});
    return reqs.successful(res);
}

function check_for_votes(conn_id, callback) {
    let checker = new VotesChecker(conn_id, callback);
    checker.start();
}


export default {
    check_for_game_started,
    get_initial_game_state,

    move,
    stay,
    cancel_action,

    get_next_state,
    check_if_performing_turn,

    vote,
    cancel_vote,
    check_for_votes
}