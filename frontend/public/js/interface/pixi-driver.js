let app;
const position_multiplier = 10;
const edge_buffer = 300;

let graphicsWidth;
let graphicsHeight;
let x_offset;
let y_offset;

let circle_radius = 30;
let player_circle_radius = 5;

let listening_for_location_click = false;
let listening_for_move = false;
let listening_for_ambush = false;

const player_colors = [0xff0000, 0x0099ff, 0x00ff00, 0xffff00];
const visited_location_color = 0x808080;
const visible_location_color =0xd1d1d1;
const current_location_color = 0x000000;
const starting_location_color = 0x06EF91;
const background_color = 0xffffff;
const connection_line_color = 0xCECECE;

//Images/Textures
let info_sprites = [];
let info_texts = [];
const footprint_texture = PIXI.Texture.from('/images/footprint.png');
const neutral_footprint_texture = PIXI.Texture.from('/images/neutral-footprint.png');
const trace_texture = PIXI.Texture.from('/images/trace.png');

const info_sprite_size = 25;
const info_sprite_spacing = 45;

function get_canvas_position(x, y) {
    return {
        x: x * position_multiplier + Math.floor(graphicsWidth / 2) + x_offset,
        y: y * position_multiplier + Math.floor(graphicsHeight / 2) + y_offset
    }
}

function init_pixi() {
    hide_start_screen();
    show_main_controls();

    document.body.style.marginTop = 0;
    document.body.style.marginLeft = 0;
    document.body.style.marginRight = 0;
    document.body.style.marginBottom = 0;

    
    let greatest_x = locations[0].position.x;
    let least_x = locations[0].position.x;
    let greatest_y = locations[0].position.y;
    let least_y = locations[0].position.y;
    for (let location of locations) {
        if (location.position.x < least_x)
            least_x = location.position.x;
        else if (location.position.x > greatest_x)
            greatest_x = location.position.x;
        if (location.position.y < least_y)
            least_y = location.position.y;
        else if (location.position.y > greatest_y)
            greatest_y = location.position.y;
    }

    graphicsWidth = greatest_x * position_multiplier - least_x * position_multiplier + edge_buffer;
    graphicsHeight = greatest_y * position_multiplier - least_y * position_multiplier + edge_buffer;

    x_offset = -1 * (least_x * position_multiplier + Math.floor(graphicsWidth / 2)) + Math.floor(edge_buffer / 2);
    y_offset = -1 * (least_y * position_multiplier + Math.floor(graphicsHeight / 2)) + Math.floor(edge_buffer / 2);

    if (graphicsWidth < window.innerWidth)
        graphicsWidth = window.innerWidth;
    if (graphicsHeight < window.innerHeight)
        graphicsHeight = window.innerHeight;

    app = new PIXI.Application({width: graphicsWidth, height: graphicsHeight});
    app.renderer.backgroundColor = background_color;
    app.renderer.plugins.interaction.autoPreventDefault = false;
    app.renderer.view.style.touchAction = 'auto';

    let main_graphics = new PIXI.Graphics();
    main_graphics.name = "main_graphics";
    main_graphics.interactive = true;
    main_graphics.pointerdown = location_click;
    app.stage.addChild(main_graphics);

    document.body.appendChild(app.view);
}

function show_locations() {

    let main_graphics = app.stage.getChildByName("main_graphics");

    //Clear screen
    main_graphics.clear();

    //Connections
    main_graphics.lineStyle(3);
    main_graphics.beginFill(connection_line_color);
    for (let location of locations) {
        if (location.visible) {
            let pos = get_canvas_position(location.position.x, location.position.y);
            for (let id of location.connections) {
                if (locations[id].visible) {
                    let toPos = get_canvas_position(locations[id].position.x, locations[id].position.y);
                    main_graphics.moveTo(pos.x, pos.y);
                    main_graphics.lineTo(toPos.x, toPos.y);
                }
            }
        }
    }
    main_graphics.lineStyle();


    //Locations
    for (let location of locations) {
        if (location.visible) {

            let pos = get_canvas_position(location.position.x, location.position.y);

            //Location text
            let location_text = main_graphics.getChildByName("loctext_" + location.id);
            if (location_text == null) {
                let text_style = new PIXI.TextStyle({
                    fontFamily: 'Lato',
                    fontSize: 12,
                    fill: 0x000000,
                    align: 'center'
                });
                let location_text = new PIXI.Text(location.name, text_style);
                location_text.name = "loctext_" + location.id;
                location_text.resolution = 2;
                let metrics = PIXI.TextMetrics.measureText(location.name, text_style);
                location_text.position.x = pos.x - metrics.width / 2;
                location_text.position.y = pos.y - 50;
                main_graphics.addChild(location_text);
            }


            if (location.id === players[player_id].location) {
                main_graphics.beginFill(current_location_color);
            }
            else if (location.id === 0) {
                main_graphics.beginFill(starting_location_color);
            }
            else if (location.visited) {
                main_graphics.beginFill(visited_location_color);
            }
            else {
                main_graphics.beginFill(visible_location_color);
            }

            main_graphics.drawCircle(pos.x, pos.y, circle_radius);

            for (let player of players) {
                if (location.id === player.location) {
                    location.visited = true;
                    main_graphics.beginFill(player_colors[player.id]);
                    main_graphics.drawCircle(pos.x, pos.y + Math.floor(circle_radius * 1.5), player_circle_radius);
                }
            }

        }
    }

}

function get_info_positions(location, info_amt) {
    let loc_pos = get_canvas_position(locations[location].position.x, locations[location].position.y);

    let positions = [];
    let total_space = info_sprite_spacing * info_amt;
    let left_x = loc_pos.x - Math.floor(total_space / 2);
    for (let i = 0; i < info_amt; i++) {
        positions.push({
            x: left_x + info_sprite_spacing * i,
            y: loc_pos.y - 80
        });
    }

    return positions;
}

function get_footprint_rotation(from, to) {
    let x = locations[from].position.x - locations[to].position.x;
    let y = locations[from].position.y - locations[to].position.y;

    let rad = Math.atan2(y, x);

    return Math.PI + rad;
}

function show_info() {

    for (let i = 0; i < info_sprites.length; i++) {
        app.stage.removeChild(info_sprites[i]);
    }
    info_sprites = [];

    for (let i = 0; i < info_texts.length; i++) {
        app.stage.removeChild(info_texts[i]);
    }
    info_texts = [];


    let text_style = new PIXI.TextStyle({
        fontFamily: 'Lato',
        fontSize: 12,
        fill: 0x000000,
        align: 'center'
    });

    for (let location_info of location_infos) {

        let info_amt = location_info.infos.length;
        let info_positions = get_info_positions(location_info.location, info_amt);
        let info_index = 0;

        for (let info of location_info.infos) {

            if (info.type === 'footprint') {
                let footprint = info;
                let sprite;
                if (footprint.direction_visible)
                    sprite = new PIXI.Sprite(footprint_texture);
                else
                    sprite = new PIXI.Sprite(neutral_footprint_texture);

                sprite.x = info_positions[info_index].x;
                sprite.y = info_positions[info_index].y;

                if (footprint.age_visible) {
                    let info_text = new PIXI.Text("" + footprint.age, text_style);
                    info_text.resolution = 2;
                    let metrics = PIXI.TextMetrics.measureText("" + footprint.age, text_style);
                    info_text.position.x = sprite.x + Math.floor(info_sprite_size * 1.3) - Math.floor(metrics.width / 2);
                    info_text.position.y = sprite.y + Math.floor(info_sprite_size / 2) - Math.floor(metrics.height / 2);
                    app.stage.addChild(info_text);
                    info_texts.push(info_text);
                }

                if (footprint.direction_visible) {
                    sprite.pivot.x = Math.floor(sprite.width / 2);
                    sprite.pivot.y = Math.floor(sprite.height / 2);
                    sprite.x += Math.floor(sprite.width / 2);
                    sprite.y += Math.floor(sprite.height / 2);

                    let angle = get_footprint_rotation(info.location, footprint.direction);
                    sprite.rotation += angle;
                }

                app.stage.addChild(sprite);
                info_sprites.push(sprite);
                info_index++;
            }

            if (info.type === 'trace') {
                let trace = info;
                let sprite = new PIXI.Sprite(trace_texture);
                sprite.x = info_positions[info_index].x;
                sprite.y = info_positions[info_index].y;

                sprite.pivot.x = Math.floor(sprite.width / 2);
                sprite.pivot.y = Math.floor(sprite.height / 2);
                sprite.x += Math.floor(sprite.width / 2);
                sprite.y += Math.floor(sprite.height / 2);

                let angle = get_footprint_rotation(trace.from, info.location);
                sprite.rotation += angle;

                app.stage.addChild(sprite);
                info_sprites.push(sprite);
                info_index++;
            }

        }

    }


}



function location_click(event) {
    if (listening_for_location_click) {
        if (listening_for_move) {
            let clicked_location = false;
            for (let location of locations) {
                let pos = get_canvas_position(location.position.x, location.position.y);
                if (pos.x - circle_radius < event.data.global.x && event.data.global.x < pos.x + circle_radius && pos.y - circle_radius < event.data.global.y && event.data.global.y < pos.y + circle_radius) {
                    clicked_location = location;
                    break;
                }
            }
            if (clicked_location) {
                if (locations[players[player_id].location].connections.indexOf(clicked_location.id) >= 0) {
                    show_message("Move to " + clicked_location.name + "?");
                    //confirm_function = ready;
                    //confirm_message = "Ready for next turn.";
                    show_confirm();
                    move(clicked_location);
                } else {
                    show_message("Cannot move there.");
                    show_main_controls();
                }
            }
            listening_for_location_click = false;
            listening_for_move = false;
        }
        else if (listening_for_ambush) {
            let clicked_location = false;
            for (let location of locations) {
                let pos = get_canvas_position(location.position.x, location.position.y);
                if (pos.x - circle_radius < event.data.global.x && event.data.global.x < pos.x + circle_radius && pos.y - circle_radius < event.data.global.y && event.data.global.y < pos.y + circle_radius) {
                    clicked_location = location;
                    break;
                }
            }
            if (clicked_location) {
                if (ambush_locations.indexOf(clicked_location.id) >= 0) {
                    show_message("Start a vote to ambush " + clicked_location.name + "?");
                    //confirm_function = start_vote;
                    //confirm_message = "Vote sent."
                    show_confirm();
                    ambush(clicked_location);
                } else {
                    show_message("Cannot ambush there.");
                    show_main_controls();
                }
            }
            listening_for_location_click = false;
            listening_for_ambush = false;
        }
    }
}

/*
const texture = PIXI.Texture.from('/images/carrot.png');
let sprite = new PIXI.Sprite(texture);
*/