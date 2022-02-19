import React from "react";
import InfoBar from './InfoBar.js'
import PlayerDisplay from "./PlayerDisplay";

let infobar_height = 41; // 25 for infos + 16 for day found (or info bar spacer)
let name_height = 20;
let clickbox_height = 70;
let component_width = 300; //TODO ideally, max info bar width should not exceed this

class Location extends React.Component {
    render() {

        let info_bar_spacer;
        if (!this.state.day_found_shown) {
            info_bar_spacer = <div className="info-bar-spacer" />
        }

        return <div ref={this.loc_elem} className="location">
            {info_bar_spacer}

            <div onMouseEnter={this.showDayFound} onMouseLeave={this.hideDayFound}>
                <InfoBar
                    info={this.props.location.info}
                    canvas_positions={this.props.canvas_positions}
                    loc_id={this.props.location.id}
                    day_found_shown={this.state.day_found_shown}
                    day={this.props.day}
                />
            </div>

            <div className="loc-name">{this.props.location.name}</div>
            <div className="click-box" onClick={() => this.props.locClick(this.props.location.id)} />
            <PlayerDisplay players_here={this.props.players_here}/>
        </div>
    }

    constructor(props) {
        super(props);
        this.loc_elem = React.createRef();

        this.state = {
            day_found_shown: false
        };

        this.updatePosition = this.updatePosition.bind(this);
        this.showDayFound = this.showDayFound.bind(this);
        this.hideDayFound = this.hideDayFound.bind(this);
    }

    componentDidUpdate() {
        if (this.props.canvas_position != null) {
            this.updatePosition();
        }
    }

    //TODO get info bar height dynamically in case it needs to change
    updatePosition() {
        this.loc_elem.current.style.left = `${this.props.canvas_position.x - Math.floor(component_width/2)}px`;
        this.loc_elem.current.style.top = `${this.props.canvas_position.y - Math.floor(clickbox_height/2) - infobar_height - name_height}px`;
    }

    showDayFound() {
        this.setState({day_found_shown: true});
    }

    hideDayFound() {
        this.setState({day_found_shown: false});
    }

}

export default Location;