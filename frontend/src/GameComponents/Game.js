import React from 'react';
import GameMap from './GameMap.js';
import GameActions from "../WebInterface/GameActions";

class Game extends React.Component {
    render() {
        return <div className="view-window">
            <GameMap
                locations={this.state.locations}
                beast_path={this.state.beast_path}
                player_start={this.state.player_start}
                shouldDraw={this.state.shouldDraw}
                updateShouldDraw={this.updateShouldDraw}/>
        </div>
    }

    constructor(props) {
        super(props);

        this.state = {
            conn_id: this.props.pageData.conn_id,
            game_state: null
        };

        let react = this;
        GameActions.get_initial_game_state(this.state.conn_id)
            .then(function(game_state) {
                react.setState({game_state: game_state});
                console.log(game_state)
            })


    }

}

export default Game;


