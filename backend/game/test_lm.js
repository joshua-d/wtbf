let lm = require('./location-map');
let Game = require('./game.js');

let map = new lm(4);

console.log(map.get_path_limited_retrace(0, 0, 10, 3));