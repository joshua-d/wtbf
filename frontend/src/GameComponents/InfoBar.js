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
                            <img src={footprint_img} rotation={this.get_fp_rotation(fp)}/>
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
                            <img src={footprint_img} rotation={this.get_fp_rotation(fp)}/>
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
                        <img src={footprint_img} rotation={this.get_fp_rotation(fp)}/>
                        <div className="day-found-txt">
                            {fp.day_found}
                        </div>
                    </div>
                );
            }
            else {
                infos.push(
                    <div className="info-block">
                        <img src={footprint_img} rotation={this.get_fp_rotation(fp)}/>
                    </div>
                );
            }
        }

        for (let trace of this.props.info.traces) {
            if (this.props.day_found_shown) {
                infos.push(
                    <div className="info-block">
                        <img src={trace_img} rotation={this.get_trace_rotation(trace)}/>
                        <div className="day-found-txt">
                            {trace.day_found}
                        </div>
                    </div>
                );
            }
            else {
                infos.push(
                    <div className="info-block">
                        <img src={trace_img} rotation={this.get_trace_rotation(trace)}/>
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

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.rotate_imgs();
    }

    rotate_imgs() {
        for (let img of document.querySelectorAll('img[rotation]')) {
            let deg = img.getAttribute('rotation');
            let rotate = 'rotate(' + deg + 'deg)';
            img.style.transform = rotate;
            img.style['-webkit-transform'] = rotate;
            img.style['-moz-transform'] = rotate;
            img.style['-o-transform'] = rotate;
            img.style['-ms-transform'] = rotate;
        }
    }

    get_fp_rotation(fp) {
        let x = this.props.canvas_positions[this.props.loc_id].x - this.props.canvas_positions[fp.direction].x;
        let y = this.props.canvas_positions[this.props.loc_id].y - this.props.canvas_positions[fp.direction].y;

        let rad = Math.PI + Math.atan2(y, x) + 180;
        return (rad * 180 / Math.PI) % 360;
    }

    get_trace_rotation(trace) {
        let x = this.props.canvas_positions[this.props.loc_id].x - this.props.canvas_positions[trace.from].x;
        let y = this.props.canvas_positions[this.props.loc_id].y - this.props.canvas_positions[trace.from].y;

        let rad = Math.PI + Math.atan2(y, x) + 180;
        return (rad * 180 / Math.PI) % 360;
    }

}

export default InfoBar;