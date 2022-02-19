import React from 'react';
import VoteBlock from './VoteBlock.js';


class VotingWindow extends React.Component {
    render() {
        let vote_blocks = [];
        for (let vote of this.props.votes) {
            vote_blocks.push(<VoteBlock
                player_id={vote.player_id}
                vote_action={vote.vote_action}
                loc_name={vote.loc_name}
            />)
        }

        return <div className="voting-window">
            {vote_blocks}
        </div>
    }

    constructor(props) {
        super(props);
    }
}

export default VotingWindow;