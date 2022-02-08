import React from 'react';

class ControlPanel extends React.Component {
    render() {
        return <div className="control-panel">
            <button className="ui button cp-button">Move</button>
            <button className="ui button cp-button">Stay</button>
            <button className="ui button cp-button">Ambush</button>
            <button className="ui button cp-button">Trap</button>
        </div>
    }

    constructor(props) {
        super(props);
    }
}

export default ControlPanel;