import React from 'react';
import RoomActions from './WebInterface/RoomActions.js'
import GameActions from './WebInterface/GameActions.js';

class Home extends React.Component {
    render() {
        return <div>
            <h1 id="title">Walky-Talky Bigfoot</h1>
            <button onClick={this.create_room} className="ui button">Create Room</button>
            <button onClick={this.join_room} className="ui button">Join Room</button>
            <button onClick={this.start_game} className="ui button">Start</button>
            <p>Room: {this.state.room_id}</p>
            <p>Conn: {this.state.conn_id}</p>
        </div>
    }

    constructor(props) {
        super(props);
        this.state = {
            room_id: null,
            conn_id: null
        };

        this.create_room = this.create_room.bind(this);
        this.join_room = this.join_room.bind(this);
        this.start_game = this.start_game.bind(this);
    }

    async create_room() {
        let room_data = await RoomActions.create_room();
        if (room_data != null) {
            this.setState({
                room_id: room_data.room_id,
                conn_id: room_data.conn_id
            });

            let react = this;
            GameActions.check_for_game_started(room_data.conn_id, function(res, interval) {
                if (res.data) {
                    clearInterval(interval); //can't return true after page change, must clear manually
                    react.props.changePage('Game', {conn_id: this.state.conn_id});
                }
                else {
                    return false;
                }
            });
        }
    }

    async join_room() {
        let room_id = prompt('Enter room ID:');
        let room_data = await RoomActions.join_room(room_id);
        if (room_data != null) {
            this.setState({
                room_id: room_data.room_id,
                conn_id: room_data.conn_id
            });

            let react = this;
            GameActions.check_for_game_started(room_data.conn_id, function(res, interval) {
                if (res.data) {
                    clearInterval(interval); //can't return true after page change, must clear manually
                    react.props.changePage('Game', {conn_id: this.state.conn_id});
                }
                else {
                    return false;
                }
            });
        }
    }

    async start_game() {
        let game_data = await RoomActions.start_game(this.state.conn_id);
        if (game_data) {
            this.props.changePage('Game', {conn_id: this.state.conn_id});
        }
    }
}

export default Home;


