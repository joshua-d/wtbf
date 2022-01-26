const NodeMap = require('./node-map.js');

const beach_chance = 0.33;
const base_village_amt = 1;
const village_amt_variability = 1;

const locations = [
    "{ \"name\": \"Forest\",\"trace\": \"sap\" }",
    "{ \"name\": \"Ruins\",\"trace\": \"rubble\" }",
    "{ \"name\": \"Sinkhole\", \"trace\": \"dirt\" }",
    "{ \"name\": \"Farm\", \"trace\": \"grain\" }",
    "{ \"name\": \"Meadow\", \"trace\": \"grass\" }",
    "{ \"name\": \"Cave\", \"trace\": \"rocks\" }",
    "{ \"name\": \"Steppe\",\"trace\": \"reeds\" }",
    "{ \"name\": \"Shrine\",\"trace\": \"apples\" }",
    "{ \"name\": \"Cliff\", \"trace\": \"pebbles\" }",
    "{ \"name\": \"Mountain\", \"trace\": \"stone\" }",
    "{ \"name\": \"Bog\", \"trace\": \"slime\" }",
    "{ \"name\": \"Well\", \"trace\": \"water\" }",
    "{ \"name\": \"Pond\", \"trace\": \"scum\" }",
    "{ \"name\": \"Waterfall\",\"trace\": \"driftwood\" }",
    "{ \"name\": \"Gorge\",\"trace\": \"stone\" }",
    "{ \"name\": \"Watchtower\", \"trace\": \"gravel\" }",
    "{ \"name\": \"Geyser\",\"trace\": \"sulfur\" }",
    "{ \"name\": \"Temple\",\"trace\": \"limestone\" }",
    //special
    //"{ \"name\": \"Beach\",\"trace\": \"shells\" }",
    //"{ \"name\": \"Village\",\"trace\": \"meat\" }"
];

class LocationMap {

    constructor(player_amt) {
        this.node_map = new NodeMap(player_amt);
        this.location_amt = this.node_map.nodes.length;
        this.village_amt = base_village_amt + player_amt - 2 - village_amt_variability + Math.floor(Math.random() * (village_amt_variability * 2 + 1));
        if (this.village_amt === 0)
            this.village_amt = 1;

        this.generate_locations();
    }

    generate_locations() {
        this.locations = [];

        //Location assignment
        for (let i = 0; i < this.location_amt; i++) {
            let location = JSON.parse(locations[Math.floor(Math.random() * locations.length)]);

            location.id = i;
            location.position = this.node_map.nodes[i].position;

            this.locations.push(location);
        }

        //Connection pointing
        for (let i = 0; i < this.location_amt; i++) {
            let connections = [];
            for (let conn of this.node_map.nodes[i].connections) {
                connections.push(conn)
            }
            this.locations[i].connections = connections;
        }

        //Special location handling
        for (let i = 0; i < this.locations.length; i++) {
            if (this.locations[i].connections.length === 1) {
                if (Math.random() < beach_chance) {
                    this.locations[i].name = "Beach";
                    this.locations[i].trace = "shells";
                }
            }
        }
        for (let i = 0; i < this.village_amt; i++) {
            let index = Math.floor(Math.random() * this.location_amt);
            this.locations[index].name = "Village";
            this.locations[index].trace = "meat";
        }

    }

    /*
    start: id of start
    finish: id of finish
    length: length of path
    retraces_left: number of times to retrace a location in the path
    touches: HELPER - list of locations that are in this path
     */
    get_path_limited_retrace(start, finish, length, retraces_left, touches=[]) {
        let start_loc = this.locations[start];
        let touches_clone = Array.from(touches);
        touches_clone.push(start);

        if (length === 1) {
            if (start_loc.connections.includes(finish)) {
                if ((touches_clone.includes(finish) && retraces_left === 1) || (!touches_clone.includes(finish) && retraces_left === 0)) {
                    return [start, finish];
                }
            }
            return null;
        }

        let unused_connections = [];
        for (let connection of start_loc.connections)
            unused_connections.push(connection);

        while (unused_connections.length > 0) {
            let next_connection_index = Math.floor(Math.random() * unused_connections.length);
            let next_connection = unused_connections[next_connection_index];
            unused_connections.splice(next_connection_index, 1);

            let retrace_subtractor = 0;
            if (touches_clone.includes(next_connection)) {
                if (retraces_left > 0)
                    retrace_subtractor = 1;
                else
                    continue;
            }

            let potential_path = this.get_path_limited_retrace(next_connection, finish, length - 1, retraces_left - retrace_subtractor, touches_clone);

            if (potential_path != null) {
                potential_path.unshift(start);
                return potential_path;
            }
        }

        return null;
    }

    /*
    start: id of start
    finish: id of finish
    returns: length of shortest path

    Uses Dijkstra's algo. Can be modified to give path as well, start at finish
     */
    get_shortest_path_length(start, finish) {
        let unvisited = [];
        let distance = {};
        for (let loc of this.locations) {
            unvisited.push(loc.id);
            distance[loc.id] = null;
        }

        distance[start] = 0;

        let current_node = start;

        while (unvisited.length > 0) {

            for (let conn of this.locations[current_node].connections) {
                if (unvisited.includes(conn)) {
                    let my_dist = distance[current_node] + 1;
                    if (distance[conn] == null || my_dist < distance[conn])
                        distance[conn] = my_dist;
                }
            }
            unvisited.splice(unvisited.indexOf(current_node), 1);

            let least_dist = null;
            let least_dist_node = null;

            for (let node of unvisited) {
                if (least_dist == null || (distance[node] != null && distance[node] < least_dist)) {
                    least_dist = distance[node];
                    least_dist_node = node;
                }
            }

            if (least_dist_node === finish) {
                return distance[finish];
            }

            current_node = least_dist_node;
        }
        
    }

}

module.exports = LocationMap;
