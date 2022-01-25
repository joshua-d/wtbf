import React from 'react';
import GameMap from './GameMap.js';
import GameActions from "../WebInterface/GameActions";

class Game extends React.Component {
    render() {
        return <div className="view-window">
            <button onClick={this.request_locations}>Request Locations</button>
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

        this.request_locations = this.request_locations.bind(this);
        this.updateShouldDraw = this.updateShouldDraw.bind(this);

        this.state = {
            locations: [
                {position: {x: 100, y: 200}},
                {position: {x: 200, y: 300}},
                {position: {x: 300, y: 500}}
            ],
            shouldDraw: false
        }
    }

    async request_locations() {
        let res_data = await GameActions.request_locations();
        this.setState({
            locations: res_data.locations,
            beast_path: res_data.beast_path,
            player_start: res_data.player_start,
            shouldDraw: true
        });
        console.log('got locs')
    }
    
    updateShouldDraw(shouldDraw) {
        this.setState({
            shouldDraw: shouldDraw
        });
    }
}

export default Game;


