import React from "react";
import InfoBar from './InfoBar.js'

let infobar_height = 27;
let name_height = 20;
let clickbox_height = 70;
let component_width = 300; //TODO ideally, max info bar width should not exceed this

class Location extends React.Component {
    render() {
        return <div ref={this.loc_elem} className="location">
            <InfoBar info={this.props.location.info}/>
            <div className="loc-name">{this.props.location.name}</div>
            <div className="click-box" onClick={() => this.props.locClick(this.props.location.id)}>

            </div>
        </div>
    }

    constructor(props) {
        super(props);
        this.loc_elem = React.createRef();

        this.updatePosition = this.updatePosition.bind(this);
    }

    componentDidUpdate() {
        if (this.props.canvas_position != null) {
            this.updatePosition();
        }
    }

    updatePosition() {
        this.loc_elem.current.style.left = `${this.props.canvas_position.x - Math.floor(component_width/2)}px`;
        this.loc_elem.current.style.top = `${this.props.canvas_position.y - Math.floor(clickbox_height/2) - infobar_height - name_height}px`;
    }


}

export default Location;