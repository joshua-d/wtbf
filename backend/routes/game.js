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
    let params = req.query;
    console.log(params);
    res.send({status: 'success'});
});


module.exports = router;