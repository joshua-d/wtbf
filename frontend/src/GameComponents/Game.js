import React from 'react';
import GameMap from './GameMap.js';
import ControlPanel from './ControlPanel.js';
import GameActions from "../WebInterface/GameActions.js";
import MessageWindow from "./MessageWindow";
import VotingWindow from "./VotingWindow";

//TODO consider stopping next game state checker on cancel action - return checker? or provide stop in interface

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
                listening_for_move_click={this.state.listening_for_move_click}
                listening_for_ambush_click = {this.state.listening_for_ambush_click}
                confirming={this.state.confirming}
                confirm_fn={this.state.confirm_fn}
                cancel_fn={this.state.cancel_fn}
                action_set={this.state.action_set}
                msg={this.state.cp_msg}
                can_ambush={this.can_ambush()}
                can_trap={this.can_trap()}
                game_over={this.state.game_state.game_over}
            />

            <MessageWindow
                msgs={this.state.game_state.messages}
            />

            <VotingWindow
                votes={this.state.votes}
            />
        </div>
    }

    constructor(props) {
        super(props);

        this.state = {
            conn_id: this.props.pageData.conn_id,
            game_state: {
                players: [],
                locations: [],
                messages: []
            },

            shouldDraw: false,
            listening_for_move_click: false,
            listening_for_ambush_click: false,
            confirming: false,
            confirm_fn: null,
            cancel_fn: null,
            action_set: false,
            cp_msg: '',

            votes: []
        };

        this.getLocationById = this.getLocationById.bind(this);
        this.updateShouldDraw = this.updateShouldDraw.bind(this);
        this.locClick = this.locClick.bind(this);
        this.cpClick = this.cpClick.bind(this);
        this.ambush = this.ambush.bind(this);
        this.cancel_choice = this.cancel_choice.bind(this);
        this.cancel_action = this.cancel_action.bind(this);
        this.cancel_vote = this.cancel_vote.bind(this);
        this.get_next_state = this.get_next_state.bind(this);

        // TODO move these into mount?
        let react = this;
        GameActions.get_initial_game_state(this.state.conn_id)
            .then(function(game_state) {
                react.setState({game_state: game_state, shouldDraw: true});
                console.log(game_state)
            });

        GameActions.check_for_votes(this.state.conn_id, function(votes) {
            let state_votes = [];
            //console.log(votes);
            for (let vote of votes) {
                if (react.can_trap() && vote.loc_id === react.state.game_state.your_loc) {
                    state_votes.push({
                        player_id: vote.player_id,
                        vote_action: 'trap at',
                        loc_name: react.getLocationById(vote.loc_id).name
                    });
                }
                else {
                    state_votes.push({
                        player_id: vote.player_id,
                        vote_action: 'ambush',
                        loc_name: react.getLocationById(vote.loc_id).name
                    });
                }
            }
            if (react.state.votes.length !== 0 || state_votes.length !== 0)
                react.setState({votes: state_votes});
            return false;
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
        if (this.state.listening_for_move_click) {
            let your_loc = this.getLocationById(this.state.game_state.your_loc);

            if (your_loc.connections.includes(loc_id)) {
                let move_loc = this.getLocationById(loc_id);
                let react = this;
                this.setState({
                    listening_for_move_click: false,
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
        else if (this.state.listening_for_ambush_click) {
            if (this.can_ambush_at(loc_id)) {
                let ambush_loc = this.getLocationById(loc_id);
                let react = this;
                this.setState({
                    listening_for_ambush_click: false,
                    confirming: true,
                    confirm_fn: () => react.ambush(loc_id),
                    cancel_fn: react.cancel_choice,
                    cp_msg: `Start a vote to ambush at the ${ambush_loc.name}?`
                });
            }
            else {
                this.setState({
                    cp_msg: "Invalid ambush location. Choose a different location or click Cancel."
                });
            }
        }
    }

    cpClick(btn) {
        if (btn === 'move') {
            let react = this;
            this.setState({
                listening_for_move_click: true,
                cancel_fn: react.cancel_choice,
                cp_msg: "Click the location you'd like to move to."
            });
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
        else if (btn === 'ambush') {
            let react = this;
            this.setState({
                listening_for_ambush_click: true,
                cancel_fn: react.cancel_choice,
                cp_msg: "Click the location you'd like to ambush."
            });
        }
        else if (btn === 'trap') {
            let your_loc = this.getLocationById(this.state.game_state.your_loc);
            let react = this;
            this.setState({
                confirming: true,
                confirm_fn: () => react.ambush(this.state.game_state.your_loc),
                cancel_fn: react.cancel_choice,
                cp_msg: `Start a vote to trap at the ${your_loc.name}?`
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

        this.get_next_state();
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

        this.get_next_state();
    }

    /* Assumes loc_id has already been verified as valid ambush loc in locClick */
    ambush(loc_id, trap) {
        let loc = this.getLocationById(loc_id);
        let msg = `You voted to ambush ${loc.name} tomorrow.`;
        if (trap) {
            msg = `You voted to trap at ${loc.name} tomorrow.`;
        }

        this.setState({
            confirming: false,
            action_set: true,
            cancel_fn: this.cancel_vote,
            cp_msg: msg
        });

        GameActions.vote(this.state.conn_id, loc_id);

        // TODO may not want to set action_set to false in callback
        this.get_next_state();
    }

    cancel_choice() {
        this.setState({listening_for_move_click: false, listening_for_ambush_click: false, confirming: false, cp_msg: ''});
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

    async cancel_vote() {
        let vote_canceled = await GameActions.cancel_vote(this.state.conn_id);
        if (vote_canceled) {
            this.setState({
                action_set: false,
                cp_msg: ''
            });
        }
    }

    can_ambush() {
        // { loc_id -> num players connected to it }
        let player_connections = {};
        for (let player of this.state.game_state.players) {
            player_connections[player.location] = 0;
            for (let conn of this.getLocationById(player.location).connections) {
                player_connections[conn] = 0;
            }
        }
        for (let player of this.state.game_state.players) {
            player_connections[player.location]++;
            for (let conn of this.getLocationById(player.location).connections) {
                player_connections[conn]++;
            }
        }
        for (let loc_conns of Object.values(player_connections)) {
            if (loc_conns >= this.state.game_state.players.length) {
                return true;
            }
        }
        return false;
    }

    can_ambush_at(loc_id) {
        for (let player of this.state.game_state.players) {
            if (player.location !== loc_id && !this.getLocationById(player.location).connections.includes(loc_id)) {
                return false;
            }
        }
        return true;
    }

    can_trap() {
        let trap_loc = null;
        for (let player of this.state.game_state.players) {
            if (trap_loc == null) {
                trap_loc = player.location;
            }
            else if (player.location !== trap_loc) {
                return false;
            }
        }
        return true;
    }

    get_next_state() {
        let react = this;
        GameActions.get_next_state(this.state.conn_id, function(game_state) {
            if (game_state !== null) {
                console.log(game_state);
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

}

export default Game;


