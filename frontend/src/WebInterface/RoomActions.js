import reqs from "./requests";

async function create_room() {
    let res = await reqs.request('/rooms/create-room', 'POST');
    if (reqs.successful(res)) {
        return res.data;
    }
}

async function join_room(room_id) {
    let res = await reqs.request('/rooms/join-room', 'POST', {
        room_id: room_id
    });
    if (reqs.successful(res)) {
        return res.data;
    }
}

//TODO consider moving this to game file instead of here
async function start_game(conn_id) {
    let res = await reqs.request('/game/start-game', 'POST', {
        conn_id: conn_id
    });
    return reqs.successful(res);
}

export default {
    create_room,
    join_room,
    start_game
}