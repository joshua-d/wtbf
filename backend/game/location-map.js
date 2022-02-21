const NodeMap = require('./node-map.js');

const beach_chance = 0.33;
const base_village_amt = 1;
const village_amt_variability = 1;

const locations = [
    { name: 'Forest', trace: 'sap' },
    { name: 'Ruins', trace: 'rubble' },
    { name: 'Sinkhole', trace: 'dirt' },
    { name: 'Farm', trace: 'grain' },
    { name: 'Meadow', trace: 'grass' },
    { name: 'Cave', trace: 'rocks' },
    { name: 'Steppe', trace: 'reeds' },
    { name: 'Shrine', trace: 'apples' },
    { name: 'Cliff', trace: 'pebbles' },
    { name: 'Mountain', trace: 'stone' },
    { name: 'Bog', trace: 'slime' },
    { name: 'Well', trace: 'water' },
    { name: 'Pond', trace: 'scum' },
    { name: 'Waterfall', trace: 'driftwood' },
    { name: 'Gorge', trace: 'stone' },
    { name: 'Watchtower', trace: 'gravel' },
    { name: 'Geyser', trace: 'sulfur' },
    { name: 'Temple', trace: 'limestone' },

    { name: 'Ridge', trace: 'pebbles' },
    { name: 'Hill', trace: 'moss' },
    { name: 'Wetlands', trace: 'algae' },
];

const names = [
    'Kakariko',
    'Eldin',
    'Marley',
    'Ordon',
    'Twilight',
    'Hyrule',
    'Eldia',
    'Venerable',
    'Hero',
    'Mikasa',
    'Armin',
    'Pyxis',
    'Erwin',
    'Goron',
    'Zora',
    'Mipha',
    'Daruk',
    'Urbosa',
    'Rito',
    'Medli',
    'Morgana',
    'Merlin',
    'Vi',
    'Jinx',
    'Corrin',
    'Robin',
    'Kokiri',
    'Gerudo',
    'Epona',
    'Spectacle',
    'Lupin',
    'Honorable',
    'Windfall',
    'Dragon Roost'
];


class LocationMap {

    constructor(player_amt) {
        this.node_map = new NodeMap(player_amt);
        this.location_amt = this.node_map.nodes.length;
        this.village_amt = base_village_amt + player_amt - 2 - village_amt_variability + Math.floor(Math.random() * (village_amt_variability * 2 + 1));
        if (this.village_amt === 0)
            this.village_amt = 1;

        this._generate_locations();
    }

    /*
    Generates locations for this map, stores in this.locations
     */
    _generate_locations() {
        this.locations = [];

        //Location assignment
        for (let i = 0; i < this.location_amt; i++) {
            let location = {};
            let loc_base = locations[Math.floor(Math.random() * locations.length)];
            let name = names[Math.floor(Math.random() * names.length)];

            location.name = `${name} ${loc_base.name}`;
            location.trace = loc_base.trace;

            location.id = i;
            location.position = this.node_map.nodes[i].position;
            location.visited = false;

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
                    let name = names[Math.floor(Math.random() * names.length)];
                    this.locations[i].name = `${name} Beach`;
                    this.locations[i].trace = "shells";
                }
            }
        }
        for (let i = 0; i < this.village_amt; i++) {
            let index = Math.floor(Math.random() * this.location_amt);
            let name = names[Math.floor(Math.random() * names.length)];
            this.locations[index].name = `${name} Village`;
            this.locations[index].trace = "meat";
        }

    }


    /*
    start: id of start
    finish: id of finish
    length: length of path
    retraces_left: number of times to retrace a location in the path
    
    touches: HELPER - list of locations that are in this path
    recursions: HELPER - current number of recursions
    max_recursions: HELPER - max number of recursions before returning null
    
    This is the main logic used to generate the beast's path.
     */
    get_path_limited_retrace(start, finish, length, retraces_left, touches=[], recursions=[0], max_recursions=1000) {
        if (recursions[0] >= max_recursions)
            return null;

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

        if (start !== finish) {
            let distances = this._get_dijkstra_distances(start, finish);
            if (distances[finish] > length)
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

            recursions[0] += 1;
            let potential_path = this.get_path_limited_retrace(next_connection, finish, length - 1, retraces_left - retrace_subtractor, touches_clone, recursions);

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
    returns: map of loc id to distance from start

    start and finish cannot be equal

    Uses Dijkstra's algo
     */
    _get_dijkstra_distances(start, finish) {
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
                return distance;
            }

            current_node = least_dist_node;
        }
    }

    /*
    start: id of start
    finish: id of finish
    distances: map of loc distances returned by calling _get_dijkstra_distances(start, finish)
    returns: list of loc ids of the shortest path between start and finish
     */
    get_shortest_path(start, finish, distances) {
        let path = [finish];
        let current_node = finish;
        while (current_node !== start) {
            let least_dist = null;
            let least_dist_node = null;
            for (let conn of this.locations[current_node].connections) {
                if (least_dist == null || (distances[conn] != null && distances[conn] < least_dist)) {
                    least_dist = distances[conn];
                    least_dist_node = conn;
                }
            }
            path.unshift(least_dist_node);
            current_node = least_dist_node;
        }
        return path;
    }

    /*
    start: id of start
    finish: id of finish
    returns: length of shortest path between start and finish
     */
    get_shortest_path_length(start, finish) {
        let distances = this._get_dijkstra_distances(start, finish);
        return distances[finish];
    }

}

module.exports = LocationMap;
