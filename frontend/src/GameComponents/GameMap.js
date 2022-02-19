import React from 'react';
import * as PIXI from 'pixi.js';

import Location from './Location.js';

let map_padding = 200;
let position_multiplier = 10;

const loc_radius = 30;

const player_colors = [0xff0000, 0x0099ff, 0x00ff00, 0xffff00, 0xff8800, 0x9900ff]; //duplicated in PlayerDisplay.js and VoteBlock.js
const visited_location_color = 0x808080;
const visible_location_color = 0xd1d1d1;
const starting_location_color = 0x000000;
const background_color = 0xffffff;
const connection_line_color = 0xCECECE;

class GameMap extends React.Component {
    render() {
        let loc_comps = [];
        for (let loc of this.props.game_state.locations) {
            let players_here = [];
            for (let player of this.props.game_state.players) {
                if (player.id !== this.props.game_state.your_id && player.location === loc.id)
                    players_here.push(player.id);
            }
            loc_comps.push(
                <Location
                    location={loc}
                    canvas_position={this.state.canvas_positions[loc.id]}
                    locClick={this.props.locClick}
                    players_here={players_here}
                    canvas_positions={this.state.canvas_positions}
                />
            )
        }
        return <div ref={this.elem} className="game-map">
            {loc_comps}
        </div>
    }

    constructor(props) {
        super(props);
        this.elem = React.createRef();

        this.state = {
            pixi: null,
            graphics: null,
            canvas_positions: {}
        };

        this.init_pixi = this.init_pixi.bind(this);
        this.getCanvasPositions = this.getCanvasPositions.bind(this);
        this.adjustMapSize = this.adjustMapSize.bind(this);
        this.getLocationById = this.getLocationById.bind(this);
        this.clearCanvas = this.clearCanvas.bind(this);
        this.drawConnectionLines = this.drawConnectionLines.bind(this);
        this.drawLocations = this.drawLocations.bind(this);
        this.setInfoRotations = this.setInfoRotations.bind(this);
    }

    componentDidMount() {
        this.init_pixi();
    }

    componentDidUpdate() {
        if (this.props.shouldDraw) {
            this.props.updateShouldDraw(false);
            let react = this;
            this.getCanvasPositions(() => {
                react.adjustMapSize();
                react.clearCanvas();
                react.drawConnectionLines();
                react.drawLocations();

                react.setInfoRotations();
            });
        }
    }

    init_pixi() {
        let elem = this.elem.current;

        let pixi = new PIXI.Application({resizeTo: elem});
        pixi.renderer.backgroundColor = 0xffffff;
        elem.appendChild(pixi.view);

        let graphics = new PIXI.Graphics();
        graphics.name = 'graphics';
        pixi.stage.addChild(graphics);

        this.setState({pixi: pixi, graphics: graphics});
    }

    getCanvasPositions(callback) {
        let locations = this.props.game_state.locations;

        let leftmost = 0;
        let upmost = 0;

        for (let loc of locations) {
            if (loc.position.x < leftmost)
                leftmost = loc.position.x;
            if (loc.position.y > upmost)
                upmost = loc.position.y;
        }

        let canvas_positions = {};
        for (let loc of locations) {
            let x = loc.position.x;
            let y = loc.position.y;
            x -= leftmost;
            y *= -1;
            y += upmost;
            x *= position_multiplier;
            y *= position_multiplier;
            x += map_padding;
            y += map_padding;
            canvas_positions[loc.id] = {x: x, y: y};
        }

        this.setState({canvas_positions: canvas_positions}, callback);
    }

    adjustMapSize() {
        let locations = this.props.game_state.locations;
        let elem = this.elem.current;
        
        let rightmost = 0;
        let downmost = 0;
        
        for (let loc of locations) {
            let cpos = this.state.canvas_positions[loc.id];
            if (cpos.x > rightmost)
                rightmost = cpos.x;
            if (cpos.y > downmost)
                downmost = cpos.y;
        }
        
        let width = rightmost + map_padding;
        let height = downmost + map_padding;

        if (width > elem.clientWidth)
            elem.style.width = `${width}px`;
        if (height > elem.clientHeight)
            elem.style.height = `${height}px`;

        this.state.pixi.resize();
    }

    //TODO sending only visible locations makes their ID not equivalent to their index in locations
    getLocationById(id) {
        for (let loc of this.props.game_state.locations) {
            if (loc.id === id)
                return loc;
        }
        return null;
    }

    clearCanvas() {
        this.state.graphics.clear();
    }

    drawConnectionLines() {
        this.state.graphics.lineStyle(2, connection_line_color);
        for (let loc of this.props.game_state.locations) {
            let loc_cpos = this.state.canvas_positions[loc.id];
            for (let conn of loc.connections) {
                this.state.graphics.moveTo(loc_cpos.x, loc_cpos.y);
                let conn_loc = this.getLocationById(conn);
                if (conn_loc != null) {
                    //TODO every line is retraced lol
                    let conn_cpos = this.state.canvas_positions[conn];
                    this.state.graphics.lineTo(conn_cpos.x, conn_cpos.y);
                }
            }
        }
        this.state.graphics.lineStyle();
    }

    drawLocations() {
        for (let loc of this.props.game_state.locations) {
            let cpos = this.state.canvas_positions[loc.id];
            let fill_color = visible_location_color;

            if (loc.visited) {
                fill_color = visited_location_color;
            }
            if (loc.id === this.props.game_state.player_start) {
                fill_color = starting_location_color;
            }
            if (loc.id === this.props.game_state.your_loc) {
                fill_color = player_colors[this.props.game_state.your_id];
            }

            this.state.graphics.beginFill(fill_color);
            this.state.graphics.drawCircle(cpos.x, cpos.y, loc_radius);
        }
    }

    setInfoRotations() {
        for (let loc of this.props.game_state.locations) {
            for (let fp of loc.info.footprints) {

            }
        }
        //this.setState({locations: this.state.locations});
    }
}

export default GameMap;