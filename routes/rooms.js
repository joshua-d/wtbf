var express = require('express');
var router = express.Router();
var path = require('path');

var Room = require('../assets/server/Room');

var rooms = [];


router.post('/create-room', function(req, res) {
    let room = new Room(rooms);
    rooms.push(room);
    res.send({
        status: 'success',
        data: {
            roomID: room.id
        }
    });
});

router.post('/join-room', function(req, res) {
    let join_room = null;
    for (let room of rooms) {
        if (room.id === req.body.roomID) {
            join_room = room;
            break;
        }
    }

    if (join_room == null) {
        res.send({
            status: 'failure',
            message: 'Room does not exist'
        });
    }
    else if (!join_room.can_join()) {
        res.send({
            status: 'failure',
            message: 'Game has already started'
        });
    }
    else {
        join_room.add_player();
        res.send({
            status: 'success',
            data: {
                roomID: req.body.roomID
            }
        });
    }
});


module.exports = router;