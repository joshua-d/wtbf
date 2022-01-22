let express = require('express');
let path = require('path');
let router = express.Router();

let database = require('../database_bridge.js');


router.post('/create-room', function(req, res) {
    let room_data = database.create_room();

    res.send({
        status: 'success',
        data: room_data
    });
});

router.post('/join-room', function(req, res) {
    let room_data = database.join_room(req.body.room_id);

    if (room_data == null) {
        res.send({
            status: 'failure',
            message: 'Unable to join room'
        })
    }

    res.send({
        status: 'success',
        data: room_data
    })
});


module.exports = router;