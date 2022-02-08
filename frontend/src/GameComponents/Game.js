import React from 'react';
import GameMap from './GameMap.js';
import GameActions from "../WebInterface/GameActions";

class Game extends React.Component {
    render() {
        return <div className="view-window">
            <GameMap
                game_state={this.state.game_state}
                shouldDraw={this.state.shouldDraw}
                updateShouldDraw={this.updateShouldDraw}/>
        </div>
    }

    constructor(props) {
        super(props);

        this.state = {
            conn_id: this.props.pageData.conn_id,
            game_state: {
                locations: []
            },
            shouldDraw: false
        };

        this.updateShouldDraw = this.updateShouldDraw.bind(this);

        let react = this;
        GameActions.get_initial_game_state(this.state.conn_id)
            .then(function(game_state) {
                react.setState({game_state: game_state, shouldDraw: true});
                console.log(game_state)
            });
    }

    updateShouldDraw(shouldDraw) {
        this.setState({
            shouldDraw: shouldDraw
        });
    }

}

export default Game;


