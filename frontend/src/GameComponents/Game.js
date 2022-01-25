import React from 'react';
import GameMap from './GameMap.js';

class Game extends React.Component {
    render() {
        return <div className="view-window">
            <GameMap />
        </div>
    }

    constructor(props) {
        super(props);
    }
}

export default Game;


