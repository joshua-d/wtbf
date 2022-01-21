//2 players 3 tries pcdf 2.5
//3 players 3 tries pcdf 3
//4 players 3 tries pcdf 3
//5 players 3 tries pcdf 2
//6 players 3 tries pcdf 2
//+ same thing

const min_distance = 20;
const near_location_amount = 16;
const connection_closeness_factor = 1.3;
const location_tries = 3;

const base_node_amount = 30;
const node_amount_player_multiplier = 10;

//init_settings() also contains variable elements


class NodeMap {

    static Node = class {
        constructor(position) {
            this.position = {
                x: position[0],
                y: position[1]
            };
            this.near_locations = [];
            this.connections = [];
        }
        get_position() {
            return [this.position.x, this.position.y];
        }
    };

    constructor(player_amt) {
        this.player_amt = player_amt;
        this.node_amt = base_node_amount + node_amount_player_multiplier*(player_amt - 2);
        this.nodes = [];

        this.available_locations = [];


        this.init_settings();
        this.generate_map();
        this.generate_connections();
    }

    init_settings() {
        
        if (this.player_amt === 2)
            this.proximity_check_distance_factor = 2.5;
        else if (this.player_amt > 2 && this.player_amt < 5)
            this.proximity_check_distance_factor = 3;
        else
            this.proximity_check_distance_factor = 2;

        this.proximity_check_distance = this.proximity_check_distance_factor * min_distance;
    }

    make_available(location) {
        this.available_locations.push(location[0] + " " + location[1]);
    }

    make_unavailable(location) {
        this.available_locations.splice(this.available_locations.indexOf(location[0] + " " + location[1]), 1);
    }

    is_available(location) {
        return this.available_locations.indexOf(location[0] + " " + location[1]) > -1;
    }

    get_distance(location_a, location_b) {
        return Math.round(Math.sqrt((location_a[0] - location_b[0])**2 + (location_a[1] - location_b[1])**2));
    }

    get_relative_location(position, distance, angle) {
        let x = Math.round(position[0] + distance * Math.cos(angle));
        let y = Math.round(position[1] + distance * Math.sin(angle));
        return[x, y];
    }

    get_available_location() {
        let tries = location_tries;
        let options = [];
        for (let i = 0; i < tries; i++) {
            let index = Math.floor(Math.random() * this.available_locations.length);
            let potential_location = [parseInt(this.available_locations[index].substring(0, this.available_locations[index].indexOf(' '))), parseInt(this.available_locations[index].substring(this.available_locations[index].indexOf(' ') + 1))];
            let num_nodes = 0;
            for (let j = 0; j < this.nodes.length; j++) {
                if (this.get_distance(this.nodes[j].get_position(), potential_location) < this.proximity_check_distance) {
                    num_nodes++;
                }
            }
            options.push([num_nodes, potential_location]);
        }
        let gv = -1;
        let gl = -1;
        for (let i = 0; i < options.length; i++) {
            if (options[i][0] > gv) {
                gv = options[i][0];
                gl = options[i][1];
            }
        }

        return gl;
    }

    create_node(position) {
        let node = new NodeMap.Node(position);

        let close_nodes = [];
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.get_distance(this.nodes[i].get_position(), position) <= min_distance * 2) {
                close_nodes.push(this.nodes[i]);
            }
        }

        this.nodes.push(node);

        //For each near location, angle
        for (let i = 0; i < near_location_amount; i++) {

            //Get position, make it available
            let near_location = this.get_relative_location(position, min_distance, Math.PI * i / (near_location_amount / 2));
            node.near_locations.push(near_location);
            this.make_available(near_location);

            //For each close node
            for (let j = 0; j < close_nodes.length; j++) {

                //For this close node's near locations
                for (let k = 0; k < close_nodes[j].near_locations.length; k++) {
                    //If the location is too close to the new node, make it unavailable
                    if (this.get_distance(position, close_nodes[j].near_locations[k]) < min_distance && this.is_available(close_nodes[j].near_locations[k])) {
                        this.make_unavailable(close_nodes[j].near_locations[k]);
                    }
                }

                //If this new node near location is too close to a close node, make it unavailable and move to next location
                if (this.get_distance(near_location, close_nodes[j].get_position()) < min_distance) {
                    this.make_unavailable(near_location);
                    break;
                }
            }
        }

        return node;
    }

    generate_node() {
        let location = this.get_available_location();
        let node = this.create_node(location);
    }

    generate_map() {
        this.create_node([0,0]);
        for (let i = 1; i < this.node_amt; i++) {
            this.generate_node();
        }
    }

    generate_connections() {
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = 0; j < this.nodes.length; j++) {
                if (i !== j) {
                    if (this.get_distance(this.nodes[i].get_position(), this.nodes[j].get_position()) <= min_distance * connection_closeness_factor) {
                        if (this.nodes[i].connections.indexOf(this.nodes[j]) < 0) {
                            this.nodes[i].connections.push(this.nodes[j]);
                            this.nodes[j].connections.push(this.nodes[i]);
                        }
                    }
                }
            }
        }
    }

}

module.exports = NodeMap;