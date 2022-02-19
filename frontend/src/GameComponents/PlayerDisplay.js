import React from "react";

const player_colors = ['#ff0000', '#0099ff', '#00ff00', '#ffff00', '#ff8800', '#9900ff']; //duplicated in GameMap.js and VoteBlock.js

class PlayerDisplay extends React.Component {
    render() {
        let dot_spans = [];
        for (let player_id of this.props.players_here) {
            dot_spans.push(<span className="player-dot" style={{"background-color": player_colors[player_id]}} />);
        }
        return <div className="player-display">
            {dot_spans}
        </div>
    }

    constructor(props) {
        super(props);

    }


}

export default PlayerDisplay;