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

    get_path(start, finish, length, retrace_amt, free_retrace=false) {
        if (!free_retrace)
            return this.get_path_max_retrace(start, finish, length, retrace_amt, start.id);
        return this.get_path_free_retrace(start, finish, retrace_amt, start.id);
    }

    get_path_free_retrace(start, finish, length, retrace_amt, start_id, retrace_map=new Map()) {

        if (length === 1) {
            if (this.locations[start].connections.indexOf(finish) >= 0) {
                if (retrace_map.has(finish)) {
                    if (retrace_map.get(finish) < retrace_amt || (finish === start_id && retrace_map.get(finish) === 0))
                        return [start, finish];
                    else
                        return [null];
                }
                return [start, finish];
            }
            else {
                return [null]
            }
        }

        let start_index = Math.floor(Math.random() * this.locations[start].connections.length);

        for (let i = 0; i < this.locations[start].connections.length; i++) {
            let connection = this.locations[start].connections[(start_index + i) % this.locations[start].connections.length];

            if (start.id === start_id) {
                if (!retrace_map.has(start_id))
                    retrace_map.set(start_id, 0);
            }

            if (retrace_map.has(connection)) {
                if (retrace_map.get(connection) === retrace_amt || (connection === finish && (retrace_map.get(finish) === retrace_amt - 1 || retrace_amt === 0))) // experimental ||
                    continue;

                retrace_map.set(connection, retrace_map.get(connection) + 1);
            }
            else
                retrace_map.set(connection, 0);

            let path = this.get_path_free_retrace(connection, finish, length - 1, retrace_amt, start_id, retrace_map);
            if (path[path.length - 1] == null) {
                retrace_map.set(connection, retrace_map.get(connection) - 1);
                continue;
            }
            path.unshift(start);
            return path;
        }

        return [null];

    }


    get_path_max_retrace(start, finish, length, retrace_amt, start_id, retrace_map=new Map()) {

        if (length === 1) {
            if (this.locations[start].connections.indexOf(finish) >= 0) {
                return [start, finish];
            }
            else {
                return [null]
            }
        }

        let count = 0;
        for (let key of retrace_map.keys()) {
            if (retrace_map.get(key) > 0)
                count += retrace_map.get(key);
        }

        let start_index = Math.floor(Math.random() * this.locations[start].connections.length);

        for (let i = 0; i < this.locations[start].connections.length; i++) {
            let connection = this.locations[start].connections[(start_index + i) % this.locations[start].connections.length];

            if (start.id === start_id) {
                if (!retrace_map.has(start_id))
                    retrace_map.set(start_id, 0);
            }

            if (retrace_map.has(connection)) {
                if (retrace_map.get(connection) >= 0 && count === retrace_amt)
                    continue;

                retrace_map.set(connection, retrace_map.get(connection) + 1);
            }
            else
                retrace_map.set(connection, 0);

            let path = this.get_path_max_retrace(connection, finish, length - 1, retrace_amt, start_id, retrace_map);
            if (path[path.length - 1] == null) {
                retrace_map.set(connection, retrace_map.get(connection) - 1);
                continue;
            }
            path.unshift(start);
            return path;
        }

        return [null];

    }

    /*
    start: id of start
    finish: id of finish
    returns: list of ids of shortest path
     */
    get_shortest_path(start, finish, length=0, shortest_length=-1, used=[]) {

        if (this.locations[start].connections.indexOf(finish) >= 0) {
            return [start, finish];
        }

        if (length > shortest_length && shortest_length >= 0) {
            return [null];
        }

        let shortest_path = [null];

        for (let i = 0; i < this.locations[start].connections.length; i++) {
            let connection = this.locations[start].connections[i];

            if (used.length === 0)
                used.push(start);

            if (used.indexOf(connection) >= 0)
                continue;

            used.push(connection);

            let path = this.get_shortest_path(connection, finish, length + 1, shortest_length, used);
            if (path[path.length - 1] == null) {
                used.pop();
                continue;
            }

            if (path.length < shortest_length || shortest_length < 0) {
                path.unshift(start);
                shortest_path = path;
                shortest_length = path.length;
            }

            used.pop();

        }

        return shortest_path;

    }

}

module.exports = LocationMap;

/*
    get_path_no_retrace(start, finish, length, start_id, used=[]) {

        if (length === 1) {
            if (start.connections.indexOf(finish) >= 0) {
                return [start, finish];
            }
            else {
                return [null]
            }
        }

        let start_index = Math.floor(Math.random() * start.connections.length);

        for (let i = 0; i < start.connections.length; i++) {
            let connection = start.connections[(start_index + i) % start.connections.length];

            if (start.id === start_id)
                used.push(start);

            if (used.indexOf(connection) >= 0 || connection === finish)
                continue;

            used.push(connection);

            let path = this.get_path_no_retrace(connection, finish, length - 1, start_id, used);
            if (path[path.length - 1] == null) {
                used.pop();
                continue;
            }
            path.unshift(start);
            return path;
        }

        return [null];

    }
*/


/*
let available_indexes = [];
        for (let i = 0; i < locations.length; i++)
            available_indexes.push(i);

        let location_queue = [];
        for (let i = 0; i < this.location_amt; i++) {
            let index = Math.floor(Math.random() * available_indexes.length);
            location_queue.push(available_indexes[index]);
            available_indexes.splice(index, 1);
            if (available_indexes.length === 0) {
                for (let i = 0; i < locations.length; i++)
                    available_indexes.push(i);
            }
        }
*/