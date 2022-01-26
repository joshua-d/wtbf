let lm = require('./location-map');
let Game = require('./game.js');

let map = new lm(4);

console.log(map.get_shortest_path(0, 25));