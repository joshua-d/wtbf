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


module.exports = router;