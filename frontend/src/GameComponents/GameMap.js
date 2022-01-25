import React from 'react';
import * as PIXI from 'pixi.js';

class GameMap extends React.Component {
    render() {
        return <div ref={this.elem} className="game-map">
        </div>
    }

    constructor(props) {
        super(props);
        this.elem = React.createRef();

        this.init_pixi = this.init_pixi.bind(this);
    }

    componentDidMount() {
        this.init_pixi();
    }

    init_pixi() {
        let pixi = new PIXI.Application();
        pixi.renderer.backgroundColor = '#ffffff';
        this.elem.current.appendChild(pixi.view);
        let graphics = new PIXI.Graphics();
        pixi.stage.addChild(graphics);
        graphics.beginFill(0x0000ff);
        graphics.drawCircle(200, 200, 50);
    }
}

export default GameMap;