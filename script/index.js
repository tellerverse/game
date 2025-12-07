import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { firebaseConfig } from "../firebase.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.querySelectorAll(".game").forEach(el => {
  el.onclick = () => {
    location.href = `/games/?game=${el.dataset.game}`;
  };
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
