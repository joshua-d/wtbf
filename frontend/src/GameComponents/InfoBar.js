import React from "react";
import footprint_img from '../Images/footprint.png';
import trace_img from '../Images/trace.png';
import marking_img from '../Images/marking.png';

class InfoBar extends React.Component {
    render() {

        let infos = [];

        for (let fp of this.props.info.aged_footprints) {
            if (this.props.day_found_shown) {
                infos.push(
                    <div className="info-block">
                        <div className="aged-block">
                            <img src={footprint_img}/>
                            <div className="age-txt">{fp.day_found - fp.day_made}</div>
                        </div>
                        <div className="day-found-txt">
                            {fp.day_found}
                        </div>
                    </div>
                );
            }
            else {
                infos.push(
                    <div className="info-block">
                        <div className="aged-block">
                            <img src={footprint_img}/>
                            <div className="age-txt">{fp.day_found - fp.day_made}</div>
                        </div>
                    </div>
                );
            }
        }

        for (let fp of this.props.info.footprints) {
            if (this.props.day_found_shown) {
                infos.push(
                    <div className="info-block">
                        <img src={footprint_img}/>
                        <div className="day-found-txt">
                            {fp.day_found}
                        </div>
                    </div>
                );
            }
            else {
                infos.push(
                    <div className="info-block">
                        <img src={footprint_img}/>
                    </div>
                );
            }
        }

        for (let trace of this.props.info.traces) {
            if (this.props.day_found_shown) {
                infos.push(
                    <div className="info-block">
                        <img src={trace_img}/>
                        <div className="day-found-txt">
                            {trace.day_found}
                        </div>
                    </div>
                );
            }
            else {
                infos.push(
                    <div className="info-block">
                        <img src={trace_img}/>
                    </div>
                );
            }
        }

        for (let marking of this.props.info.aged_markings) {
            if (this.props.day_found_shown) {
                infos.push(
                    <div className="info-block">
                        <div className="aged-block">
                            <img src={marking_img}/>
                            <div className="age-txt">{marking.day_found - marking.day_made}</div>
                        </div>
                        <div className="day-found-txt">
                            {marking.day_found}
                        </div>
                    </div>
                );
            }
            else {
                infos.push(
                    <div className="info-block">
                        <div className="aged-block">
                            <img src={marking_img}/>
                            <div className="age-txt">{marking.day_found - marking.day_made}</div>
                        </div>
                    </div>
                );
            }
        }

        for (let marking of this.props.info.markings) {
            if (this.props.day_found_shown) {
                infos.push(
                    <div className="info-block">
                        <img src={marking_img}/>
                        <div className="day-found-txt">
                            {marking.day_found}
                        </div>
                    </div>
                );
            }
            else {
                infos.push(
                    <div className="info-block">
                        <img src={marking_img}/>
                    </div>
                );
            }
        }

        return <div className="info-bar">
                {infos}
            </div>
    }

    constructor(props) {
        super(props);
    }

}

export default InfoBar;