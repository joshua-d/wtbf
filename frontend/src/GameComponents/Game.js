import React from 'react';
import GameMap from './GameMap.js';
import ControlPanel from './ControlPanel.js';
import GameActions from "../WebInterface/GameActions.js";
import MessageWindow from "./MessageWindow";

class Game extends React.Component {
    render() {
        return <div className="view-window">
            <GameMap
                game_state={this.state.game_state}
                shouldDraw={this.state.shouldDraw}
                updateShouldDraw={this.updateShouldDraw}
                locClick={this.locClick}
            />

            <ControlPanel
                conn_id={this.state.conn_id}
                cpClick={this.cpClick}
                listening_for_loc_click={this.state.listening_for_loc_click}
                confirming={this.state.confirming}
                confirm_fn={this.state.confirm_fn}
                cancel_fn={this.state.cancel_fn}
                action_set={this.state.action_set}
                msg={this.state.cp_msg}
            />

            <MessageWindow
                msgs={this.state.game_state.messages}
            />
        </div>
    }

    constructor(props) {
        super(props);

        this.state = {
            conn_id: this.props.pageData.conn_id,
            game_state: {
                locations: [],
                messages: []
            },

            shouldDraw: false,
            listening_for_loc_click: false,
            confirming: false,
            confirm_fn: null,
            cancel_fn: null,
            action_set: false,
            cp_msg: ''
        };

        this.getLocationById = this.getLocationById.bind(this);
        this.updateShouldDraw = this.updateShouldDraw.bind(this);
        this.locClick = this.locClick.bind(this);
        this.cpClick = this.cpClick.bind(this);
        this.cancel_choice = this.cancel_choice.bind(this);
        this.cancel_action = this.cancel_action.bind(this);

        // TODO move this into mount?
        let react = this;
        GameActions.get_initial_game_state(this.state.conn_id)
            .then(function(game_state) {
                react.setState({game_state: game_state, shouldDraw: true});
                console.log(game_state)
            });
    }

    getLocationById(id) {
        for (let loc of this.state.game_state.locations) {
            if (loc.id === id)
                return loc;
        }
        return null;
    }

    updateShouldDraw(shouldDraw) {
        this.setState({
            shouldDraw: shouldDraw
        });
    }

    locClick(loc_id) {
        if (this.state.listening_for_loc_click) {
            let your_loc = this.getLocationById(this.state.game_state.your_loc);

            if (your_loc.connections.includes(loc_id)) {
                let move_loc = this.getLocationById(loc_id);
                let react = this;
                this.setState({
                    listening_for_loc_click: false,
                    confirming: true,
                    confirm_fn: () => react.move(loc_id),
                    cancel_fn: react.cancel_choice,
                    cp_msg: `Are you sure you'd like to move to the ${move_loc.name}?`
                });
            }
            else {
                this.setState({
                    cp_msg: "Invalid move. Choose a different location or click Cancel."
                });
            }
        }
    }

    cpClick(btn) {
        if (btn === 'move') {
            this.setState({listening_for_loc_click: true, cp_msg: "Click the location you'd like to move to."});
        }
        else if (btn === 'stay') {
            let your_loc = this.getLocationById(this.state.game_state.your_loc);
            let react = this;
            this.setState({
                confirming: true,
                confirm_fn: () => react.stay(your_loc.id),
                cancel_fn: react.cancel_choice,
                cp_msg: `Are you sure you'd like to stay at the ${your_loc.name}?`
            });
        }
    }

    move(loc_id) {
        let loc = this.getLocationById(loc_id);
        this.setState({
            confirming: false,
            action_set: true,
            cancel_fn: this.cancel_action,
            cp_msg: `Moving to ${loc.name} tomorrow.`
        });

        GameActions.move(this.state.conn_id, loc_id);

        //TODO duplicated - consider moving into a fn
        let react = this;
        GameActions.get_next_state(this.state.conn_id, function(game_state) {
            console.log(game_state);
            if (game_state !== null) {
                react.setState({
                    game_state: game_state,
                    shouldDraw: true,
                    action_set: false,
                    cp_msg: ''
                });
                return true;
            }
            return false;
        });
    }

    stay(loc_id) {
        let loc = this.getLocationById(loc_id);
        this.setState({
            confirming: false,
            action_set: true,
            cancel_fn: this.cancel_action,
            cp_msg: `Staying at ${loc.name} until tomorrow`
        });

        GameActions.stay(this.state.conn_id);

        let react = this;
        GameActions.get_next_state(this.state.conn_id, function(game_state) {
            console.log(game_state);
            if (game_state !== null) {
                react.setState({
                    game_state: game_state,
                    shouldDraw: true,
                    action_set: false,
                    cp_msg: ''
                });
                return true;
            }
            return false;
        });
    }

    cancel_choice() {
        this.setState({listening_for_loc_click: false, confirming: false, cp_msg: ''});
    }

    async cancel_action() {
        let action_canceled = await GameActions.cancel_action(this.state.conn_id);
        if (action_canceled) {
            this.setState({
                action_set: false,
                cp_msg: ''
            });
        }
    }

}

export default Game;


