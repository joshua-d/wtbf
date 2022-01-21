function init_socket(socket_driver) {

    let socket = io();
    let player_id;


    //Rooms

    function create_room() {
        socket.emit('create-room-req', null);
    }

    function join_room() {
        let room = prompt("Enter room:");
        socket.emit('join-room-req', room);
    }

    socket.on('room-res', function(room_data) {
        if (room_data.success) {
            player_id = room_data.player_id;
            document.getElementById("room-disp").innerHTML = "Room: " + room_data.room;
        }
        else {
            alert("Room '" + room_data.room + "' not valid");
        }
    });


    //Game
    socket.on('action-res', function(res) {
        if (res.type === "game-state") {
            init_game(res.game_state)
        }

        else if (res.type === "player-state-ready") {
            get_player_state();
        }

        else if (res.type === "player-state") {
            update_state(res.player_state);
        }

        else if (res.type === "vote-started") {
            show_vote(res.action);
        }

        else if (res.type === "vote-ended") {
            end_vote(res.answer);
        }
    });

    function start_game() {
        action = {type: "start-game"};
        emit_action();
    }

    function ready() {
        emit_action();
    }

    function emit_action() {
        socket.emit('action-req', action);
    }

    function init_game(game_state) {
        init_state(game_state, player_id);
        init_pixi();
        show_locations();
    }

    function get_player_state() {
        action = {
            type: "get-player-state",
            player_id: player_id
        };
        emit_action();
    }

    function end_vote(answer) {
        if (answer) {

        }
        else {
            show_message("The vote failed.");
            show_main_controls();
            action = null;
        }
    }

    function vote(answer) {
        action = {
            type: "vote",
            answer: answer
        };
        emit_action();
    }


    socket_driver.create_room = create_room;
    socket_driver.join_room = join_room;
    socket_driver.start_game = start_game;

    socket_driver.ready = ready;
    socket_driver.vote = vote;

}