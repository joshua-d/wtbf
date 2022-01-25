import React from 'react';

class Game extends React.Component {
    render() {
        return <div>
            <h1>Game</h1>
            <button onClick={() => alert(this.props.pageData.d1)}/>
        </div>
    }

    constructor(props) {
        super(props);
    }
}

export default Game;


