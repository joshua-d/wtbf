import React from 'react';

class Home extends React.Component {
    render() {
        return <div>
            <h1>Home</h1>
            <button onClick={() => this.props.changePage('Game')}/>
        </div>
    }
}

export default Home;


