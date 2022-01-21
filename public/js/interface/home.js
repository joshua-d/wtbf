var roomID;

async function create_room() {
    let res = await rooms_request('create-room', 'POST');
    if (successful(res)) {
        $('#room-disp').text('Room: ' + res.data.roomID);
        roomID = res.data.roomID;
    }
}

async function join_room() {
    let roomID = prompt("Enter room ID");
    let res = await rooms_request('join-room', 'POST', {
        roomID: roomID
    });
    if (successful(res)) {
        alert('Successfully joined room.');
        $('#room-disp').text('Room: ' + res.data.roomID);
        roomID = res.data.roomID;
    } else
        alert(res.message);
}

async function start_game() {
    if (roomID == null)
        return;

    let res = await game_request('start', 'POST', {
        roomID: roomID
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