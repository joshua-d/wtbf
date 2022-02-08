import React from 'react';
import GameActions from '../WebInterface/GameActions.js';

class ControlPanel extends React.Component {
    render() {

        let btns = [];
        if (!this.props.listening_for_loc_click && !this.props.confirming) {
            btns.push(<button className="ui button cp-button" onClick={this.move}>Move</button>);
            btns.push(<button className="ui button cp-button" onClick={this.stay}>Stay</button>);
            if (this.state.can_ambush) {
                btns.push(<button className="ui button cp-button">Ambush</button>);
            }
            if (this.state.can_trap) {
                btns.push(<button className="ui button cp-button">Trap</button>);
            }
        }
        if (this.props.confirming) {
            btns.push(<button className="ui button cp-button" onClick={this.props.confirm_action}>Yes</button>);
            btns.push(<button className="ui button cp-button" onClick={this.props.cancel_action}>No</button>);
        }
        if (this.props.listening_for_loc_click) {
            btns.push(<button className="ui button cp-button" onClick={this.props.cancel_action}>Cancel</button>)
        }

        return <div className="control-panel">
            <p className="cp-msg-txt">{this.props.msg}</p>
            <div className="cp-btn-bar">
                {btns}
            </div>
        </div>
    }

    constructor(props) {
        super(props);

        this.state = {
            confirming: false,
            can_ambush: false,
            can_trap: false
        };

        this.move = this.move.bind(this);
        this.stay = this.stay.bind(this);
    }

    move() {
        this.props.cpClick('move');
    }

    stay() {
        this.props.cpClick('stay');
    }

}


export default ControlPanel;