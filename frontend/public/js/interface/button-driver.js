
let confirm_message;
let confirm_function;

function show_message(msg) {
    document.getElementById('msg-window').innerHTML = msg;
}

function show_main_controls() {

    document.getElementById("confirm-button").style.display = 'none';
    document.getElementById("cancel-button").style.display = 'none';

    document.getElementById("move-button").style.display = 'inline';
    document.getElementById("stay-button").style.display = 'inline';
    if (can_trap)
        document.getElementById("trap-button").style.display = 'inline';
    if (can_ambush)
        document.getElementById("ambush-button").style.display = 'inline';
}

function hide_all_controls() {
    document.getElementById("move-button").style.display = 'none';
    document.getElementById("stay-button").style.display = 'none';
    document.getElementById("trap-button").style.display = 'none';
    document.getElementById("ambush-button").style.display = 'none';
    document.getElementById("confirm-button").style.display = 'none';
    document.getElementById("cancel-button").style.display = 'none';
}

function hide_start_screen() {
    document.body.removeChild(document.getElementById("title"));
    document.body.removeChild(document.getElementById("create-room"));
    document.body.removeChild(document.getElementById("join-room"));
    document.body.removeChild(document.getElementById("start-game"));
}

function show_confirm() {
    hide_all_controls();

    document.getElementById("confirm-button").style.display = 'inline';
    document.getElementById("cancel-button").style.display = 'inline';
}

function show_vote(action) {
    if (action.type === 'ambush') {
        document.getElementById("vote-msg").innerHTML = "Player " + action.player_id + " has started a vote to ambush " + locations[action.location].name + ".";
        document.getElementById("yes-vote-button").style.display = 'inline';
        document.getElementById("no-vote-button").style.display = 'inline';
    }
    else if (action.type === 'trap') {
        document.getElementById("vote-msg").innerHTML = "Player " + action.player_id + " has started a vote to trap the beast here.";
        document.getElementById("yes-vote-button").style.display = 'inline';
        document.getElementById("no-vote-button").style.display = 'inline';
    }

    hide_all_controls();
}

function hide_vote() {
    document.getElementById("vote-msg").innerHTML = "";
    document.getElementById("yes-vote-button").style.display = 'none';
    document.getElementById("no-vote-button").style.display = 'none';
}

function update_day() {
    document.getElementById("day-counter").innerHTML = "Day: " + day;
}

$(function() {

    let socket_driver = {};
    init_socket(socket_driver);

    function move_click() {
        listening_for_location_click = true;
        listening_for_move = true;
        confirm_message = "Ready for next turn.";
        confirm_function = socket_driver.ready;
        show_message("Tap a location to move to");
    }

    function stay_click() {
        show_message("Stay here?");
        stay();
        confirm_message = "Ready for next turn.";
        confirm_function = socket_driver.ready;
        show_confirm();
    }

    function ambush_click() {
        listening_for_location_click = true;
        listening_for_ambush = true;
        confirm_message = "Vote sent.";
        confirm_function = socket_driver.ready;
        show_message("Tap the location of the ambush");
    }

    function trap_click() {
        show_message("Start a vote to trap the beast here?");
        trap();
        confirm_message = "Vote sent.";
        confirm_function = socket_driver.ready;
        show_confirm();
    }

    function confirm_click() {
        show_message(confirm_message);
        hide_all_controls();
        confirm_function();
    }

    function cancel_click() {
        show_message("");
        confirm_function = null;
        confirm_message = "";
        action = null;
        show_main_controls();
    }

    function yes_vote() {
        socket_driver.vote(true);
        hide_vote();
        show_message("Vote sent.");
        hide_all_controls();
    }

    function no_vote() {
        socket_driver.vote(false);
        hide_vote();
        show_message("Vote sent.");
        hide_all_controls();
    }


    $('#create-room').click(socket_driver.create_room);

    $('#join-room').click(socket_driver.join_room);

    $('#start-game').click(socket_driver.start_game);


    $('#move-button').click(move_click);

    $('#stay-button').click(stay_click);

    $('#ambush-button').click(ambush_click);

    $('#trap-button').click(trap_click);

    $('#confirm-button').click(confirm_click);

    $('#cancel-button').click(cancel_click);

    $('#yes-vote-button').click(yes_vote);

    $('#no-vote-button').click(no_vote);

});