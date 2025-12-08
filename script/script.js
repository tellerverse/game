import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { firebaseConfig } from "../firebase.js";
import { Tik, Sudoku, Ship, Find } from "../gameclasses.js";

export const games = {
  tik: new Tik,
  sudoku: new Sudoku,
  ship: new Ship,
  find: new Find
};

for (const [key, game] of Object.entries(games)) {
  await game.init()
}

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.querySelectorAll(".game").forEach(el => {
  el.onclick = () => {
    location.href = location.hostname.endsWith("github.io") ? `/game/gamelauncher/?game=${el.dataset.game}` : `/gamelauncher/?game=${el.dataset.game}`;
  };
});

document.querySelectorAll(".game").forEach(gameEl => {
  const gameId = gameEl.dataset.game;
  if (!gameId) return;

  const colorRef = ref(db, `games/${gameId}/info/color`);

  onValue(colorRef, snap => {
    if (!snap.exists()) return;
    gameEl.style.setProperty("--color", snap.val());
  });
});


// Warte-Status pro Game
onValue(ref(db, "players"), snap => {
  const players = snap.val() || {};
  const waitingPerGame = {};

  Object.values(players).forEach(p => {
    if (p.game && p.gameState === "none") {
      waitingPerGame[p.game] = true;
    }
  });

  document.querySelectorAll(".game").forEach(el => {
    const dot = el.querySelector(".status");
    const game = el.dataset.game;
    dot.classList.toggle("online", !!waitingPerGame[game]);
  });
});
