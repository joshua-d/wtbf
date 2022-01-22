var room_id;

async function create_room() {
    let res = await rooms_request('create-room', 'POST');
    if (successful(res)) {
        $('#room-disp').text('Room: ' + res.data.room_id);
        room_id = res.data.room_id;
    }
}

async function join_room() {
    let entered_room_id = prompt("Enter room ID");
    let res = await rooms_request('join-room', 'POST', {
        room_id: entered_room_id
    });
    if (successful(res)) {
        alert('Successfully joined room.');
        $('#room-disp').text('Room: ' + res.data.room_id);
        room_id = res.data.room_id;
    } else
        alert(res.message);
}

async function start_game() {
    if (room_id == null)
        return;

    let res = await game_request('start', 'POST', {
        room_id: room_id
    });

    if (successful(res)) {
        window.location.replace('/game');
    }
}

$(function () {
    $('#create-room').click(create_room);
    $('#join-room').click(join_room);
    $('#start-game').click(start_game);
});