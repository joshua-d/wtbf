import React from 'react';


class MessageWindow extends React.Component {
    render() {
        let msgs = [];
        for (let msg of this.props.msgs) {
            msgs.push(<p className="msg-txt">{msg}</p>);
        }

        return <div className="msg-window">
            {msgs}
        </div>
    }

    constructor(props) {
        super(props);
    }
}

export default MessageWindow;