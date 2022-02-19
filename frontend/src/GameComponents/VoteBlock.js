import React from 'react';


class VoteBlock extends React.Component {
    render() {
        return <div>
            Player {this.props.player_id} has voted to {this.props.vote_action} the {this.props.loc_name}.
        </div>
    }

    constructor(props) {
        super(props);
    }
}

export default VoteBlock;