import React from 'react';

const player_colors = ['#ff0000', '#0099ff', '#00ff00', '#ffff00', '#ff8800', '#9900ff']; //duplicated in GameMap.js and PlayerDisplay.js

class VoteBlock extends React.Component {
    render() {
        return <div>
            <span className="player-dot" style={{'background-color': player_colors[this.props.player_id]}}/> Player {this.props.player_id} has voted to {this.props.vote_action} the {this.props.loc_name}.
        </div>
    }

    constructor(props) {
        super(props);
    }
}

export default VoteBlock;