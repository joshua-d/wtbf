module.exports = class {
    constructor(rooms) {
        this.id = this.generate_roomID(rooms);
        this.num_players = 0;
        this.started = false;
    }

    add_player() {
        this.num_players++;
    }

    start() {
        this.started = true;
    }

    can_join() {
        return !this.started
    }

    generate_roomID(rooms) {
        let room_num = Math.floor(Math.random() * 10000);
        let roomID = "" + room_num;
        while (roomID.length < 4)
            roomID = '0' + roomID;

        if (rooms.includes(roomID))
            return generate_roomID(rooms);
        else
            return roomID;
    }
};