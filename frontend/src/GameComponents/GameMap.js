import React from 'react';
import * as PIXI from 'pixi.js';

import Location from './Location.js';

let map_padding = 200;
let position_multiplier = 5;

const loc_radius = 20;

const player_colors = [0xff0000, 0x0099ff, 0x00ff00, 0xffff00, 0xff8800, 0x9900ff];
const visited_location_color = 0x808080;
const visible_location_color = 0xd1d1d1;
const current_location_color = 0x000000;
const starting_location_color = 0x00FFEE;
const background_color = 0xffffff;
const connection_line_color = 0xCECECE;

class GameMap extends React.Component {
    render() {
        return <div ref={this.elem} className="game-map">
        </div>
    }

    constructor(props) {
        super(props);
        this.elem = React.createRef();

        this.state = {
            pixi: null,
            graphics: null
        };

        this.init_pixi = this.init_pixi.bind(this);
        this.adjustsPositions = this.adjustsPositions.bind(this);
        this.adjustMapSize = this.adjustMapSize.bind(this);
        this.drawLocations = this.drawLocations.bind(this);
    }

    componentDidMount() {
        this.init_pixi();
    }

    componentDidUpdate(prevProps) {
        if (this.props.shouldDraw) {
            this.adjustsPositions();
            this.adjustMapSize();
            this.drawLocations();
            this.props.updateShouldDraw(false);
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

    adjustsPositions() {
        let locations = this.props.game_state.locations;

        let leftmost = 0;
        let upmost = 0;

        for (let loc of locations) {
            if (loc.position.x < leftmost)
                leftmost = loc.position.x;
            if (loc.position.y > upmost)
                upmost = loc.position.y;
        }

        for (let loc of locations) {
            loc.position.x -= leftmost;
            loc.position.y *= -1;
            loc.position.y += upmost;
            loc.position.x *= position_multiplier;
            loc.position.y *= position_multiplier;
            loc.position.x += map_padding;
            loc.position.y += map_padding;
        }
    }

    adjustMapSize() {
        let locations = this.props.game_state.locations;
        let elem = this.elem.current;
        
        let rightmost = 0;
        let downmost = 0;
        
        for (let loc of locations) {
            if (loc.position.x > rightmost)
                rightmost = loc.position.x;
            if (loc.position.y > downmost)
                downmost = loc.position.y;
        }
        
        let width = rightmost + map_padding;
        let height = downmost + map_padding;

        if (width > elem.clientWidth)
            elem.style.width = `${width}px`;
        if (height > elem.clientHeight)
            elem.style.height = `${height}px`;

        this.state.pixi.resize();
    }
    
    drawLocations() {
        this.state.graphics.clear();

        for (let loc of this.props.game_state.locations) {
            let fill_color = visible_location_color;

            if (loc.visited) {
                fill_color = visited_location_color;
            }
            if (loc.id === this.props.game_state.player_start) {
                fill_color = starting_location_color;
            }
            if (loc.id === this.props.game_state.your_loc) {
                fill_color = current_location_color;
            }

            this.state.graphics.beginFill(fill_color);
            this.state.graphics.drawCircle(loc.position.x, loc.position.y, loc_radius);
        }
    }
}

export default GameMap;