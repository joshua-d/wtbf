import React from 'react';
import GameActions from '../WebInterface/GameActions.js';

class ControlPanel extends React.Component {
    render() {

        let btns = [];
        if (!this.props.game_over) {
            if (!this.props.listening_for_move_click && !this.props.listening_for_ambush_click && !this.props.confirming && !this.props.action_set) {
                btns.push(<button className="ui button cp-button" onClick={this.move}>Move</button>);
                btns.push(<button className="ui button cp-button" onClick={this.stay}>Stay</button>);
                if (this.props.can_ambush) {
                    btns.push(<button className="ui button cp-button" onClick={this.ambush}>Ambush</button>);
                }
                if (this.props.can_trap) {
                    btns.push(<button className="ui button cp-button" onClick={this.trap}>Trap</button>);
                }
            }
            if (this.props.confirming) {
                btns.push(<button className="ui button cp-button" onClick={this.props.confirm_fn}>Yes</button>);
                btns.push(<button className="ui button cp-button" onClick={this.props.cancel_fn}>No</button>);
            }
            if (this.props.listening_for_move_click || this.props.listening_for_ambush_click || this.props.action_set) {
                btns.push(<button className="ui button cp-button" onClick={this.props.cancel_fn}>Cancel</button>)
            }
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

        this.move = this.move.bind(this);
        this.stay = this.stay.bind(this);
        this.ambush = this.ambush.bind(this);
        this.trap = this.trap.bind(this);
    }

    move() {
        this.props.cpClick('move');
    }

    stay() {
        this.props.cpClick('stay');
    }

    ambush() {
        this.props.cpClick('ambush');
    }

    trap() {
        this.props.cpClick('trap');
    }

}


export default ControlPanel;