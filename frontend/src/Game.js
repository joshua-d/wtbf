import React from 'react';

class Game extends React.Component {
    render() {
        return <div>
            <h1>Game</h1>
            <button onClick={() => this.props.changePage('Home')}/>
        </div>
    }
}

export default Game;


