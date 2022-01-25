import React from 'react';

import Home from './Home.js';
import Game from './GameComponents/Game.js';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {page: Home, pageData: null};

        this.changePage = this.changePage.bind(this);
    }
    changePage(pageName, pageData=null) {
        switch (pageName) {
            case 'Home':
                this.setState({page: Home, pageData: pageData});
                break;
            case 'Game':
                this.setState({page: Game, pageData: pageData});
                break;
            default:
                break;
        }
    }
    render() {
        return <this.state.page changePage={this.changePage} pageData={this.state.pageData} />;
    }
}



export default App;
