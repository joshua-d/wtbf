var express = require('express');
var router = express.Router();
var path = require('path');


router.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/../views/game.html'));
});

router.post('/start', function(req, res) {

    res.send({
        status: 'success'
    });
});


module.exports = router;