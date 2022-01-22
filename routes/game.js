let express = require('express');
let path = require('path');
let router = express.Router();

let database = require('../database_bridge.js');

router.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/../views/game.html'));
});

router.post('/start', function(req, res) {
    database.start_game()
});


module.exports = router;