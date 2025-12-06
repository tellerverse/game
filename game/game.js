import { TikTakToe, Sudoku, SchiffeVersenken } from "../game.js";

const params = new URLSearchParams(location.search);
const gameName = params.get("game");

if (!gameName) location.href = "/";

const games = {
  tiktaktoe: TikTakToe,
  sudoku: Sudoku,
  schiffe: SchiffeVersenken
};

const GameClass = games[gameName];
if (!GameClass) location.href = "/";

const game = new GameClass();
game.start();