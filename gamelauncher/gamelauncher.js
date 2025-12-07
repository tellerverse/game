import { games } from '../script/script.js';
import { getIP } from '../utils.js';

console.log("gamelauncher start")
const params = new URLSearchParams(location.search);
const gameName = params.get("game");

console.log("gamelauncher start")
if (!gameName) location.href = "/";

const GameClass = games[gameName];
if (!GameClass) location.href = "/";

const IP = await getIP();
GameClass.addPlayer(IP);
console.log("werw")