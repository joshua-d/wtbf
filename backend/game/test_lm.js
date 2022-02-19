let lm = require('./location-map');
let Game = require('./game.js');

let game = new Game(0, 2);

game._generate_beast_info();
console.log(game.infos[game.beast.location]);
game._generate_beast_info();
console.log(game.infos[game.beast.location]);
game._generate_beast_info();
console.log(game.infos[game.beast.location]);