let express = require('express');
let path = require('path');
let router = express.Router();

let database = require('../database_bridge.js');

router.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/../views/game.html'));
});

router.post('/start-game', function(req, res) {
    let game_data = database.start_game(req.body.conn_id);
    res.send({
        status: 'success'
    });
});

router.get('/is-game-started', function(req, res) {
    //TODO sanitize req.query.conn_id (and in other handlers)
    res.send({status: 'success', data: database.check_if_game_started(req.query.conn_id)});
});

router.get('/initial-game-state', function(req, res) {
    res.send({status: 'success', data: database.get_game_state(req.query.conn_id)});
});

router.post('/move-player', function(req, res) {
    //TODO tomfoolery may include req.body not being filled correctly, may break things like this
    let moved = database.move_player(req.body.conn_id, req.body.loc_id);
    if (moved)
        res.send({status: 'success'});
    else
        res.send({status: 'failure'});
});

router.post('/stay-player', function(req, res) {
    database.stay_player(req.body.conn_id);
    res.send({status: 'success'});
});

router.post('/cancel-action', function(req, res) {
    database.cancel_action(req.body.conn_id);
    res.send({status: 'success'});
});

router.get('/next-state', function(req, res) {
    let next_state = database.check_for_next_state(req.query.conn_id);
    res.send({status: 'success', data: next_state});
});

module.exports = router;