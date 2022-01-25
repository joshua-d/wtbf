import React from 'react';
import * as PIXI from 'pixi.js';

import Location from './Location.js';

let map_padding = 20;
let position_multiplier = 5;

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

    componentDidUpdate() {
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
        let locations = this.props.locations;

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
        let locations = this.props.locations;
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
        console.log('drawing');
        this.state.graphics.clear();

        for (let loc of this.props.locations) {
            this.state.graphics.beginFill(0x0000ff);

            if (this.props.beast_path.includes(loc.id))
                this.state.graphics.beginFill(0x00ff00);
            if (this.props.player_start === loc.id)
                this.state.graphics.beginFill(0x000000);

            this.state.graphics.drawCircle(loc.position.x, loc.position.y, 20);

            if (this.props.beast_path.includes(loc.id)) {
                let text_style = new PIXI.TextStyle({
                    fontFamily: 'Lato',
                    fontSize: 16,
                    fill: 0x000000,
                    align: 'center'
                });
                let location_text = new PIXI.Text(this.props.beast_path.indexOf(loc.id), text_style);
                location_text.position = loc.position;
                this.state.graphics.addChild(location_text)
            }
        }
    }
}

export default GameMap;