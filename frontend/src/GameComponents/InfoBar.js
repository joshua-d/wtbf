import React from "react";
import footprint_img from '../Images/footprint.png';

class InfoBar extends React.Component {
    render() {
        return <div className="info-bar">
            <img src={footprint_img}/>
            <img src={footprint_img}/>
            <img src={footprint_img}/>
            <img src={footprint_img}/>
            <img src={footprint_img}/>
            <img src={footprint_img}/>
        </div>
    }

    constructor(props) {
        super(props);
    }
}

export default InfoBar;