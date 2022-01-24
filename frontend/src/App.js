import React from 'react';

import Home from './Home.js';
import Game from './Game.js';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {page: Home};

        this.changePage = this.changePage.bind(this);
    }
    changePage(pageName) {
        switch (pageName) {
            case 'Home':
                this.setState({page: Home});
                break;
            case 'Game':
                this.setState({page: Game});
                break;
            default:
                break;
        }
    }
    render() {
        return <this.state.page changePage={this.changePage} />;
    }
}



export default App;
