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

let Game = require('../game/game');
router.get('/locations', function(req, res) {
    let g = new Game(0, 4);
    res.send({
        locations: g.map.locations,
        beast_path: g.beast.path,
        player_start: g.player_start,
    });
});


module.exports = router;