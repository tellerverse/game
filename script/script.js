import { ref, get, onValue } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { db } from "../firebasedata.js";
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

document.querySelectorAll(".game").forEach(el => {
    el.onclick = () => {
        location.href = location.hostname.endsWith("github.io") ? `/game/gamelauncher/?game=${el.dataset.game}` : `/gamelauncher/?game=${el.dataset.game}`;
    };
});

function colordots() {
    document.querySelectorAll(".game").forEach(gameEl => {
        const gameId = gameEl.dataset.game;
        if (!gameId) return;

        const colorRef = ref(db, `games/${gameId}/info/color`);

        onValue(colorRef, snap => {
            if (!snap.exists()) return;
            gameEl.style.setProperty("--color", snap.val());
        });
    });
}
colordots()
onValue(ref(db, "games"), async snap => {
    const games = snap.val() || {};
    const waitingPerGame = {};
    const colors = {
        1: "#ffff00",
        2: "#ff7700",
        3: "#ff0000"
    };
    console.log("change in games")
    for (const [gameId, gameObj] of Object.entries(games)) {
        if (!gameObj?.sessions) continue;

        let count = 0;
        for (const session of Object.values(gameObj.sessions)) {
            if (session.players) {
                count += Object.keys(session.players).length;
            }
        }

        const colorSnap = await get(ref(db, `games/${gameId}/info/color`));
        const baseColor = colorSnap.exists() ? colorSnap.val() : "";

        waitingPerGame[gameId] = colors[count] ?? baseColor;
    }


    document.querySelectorAll(".game").forEach(el => {
        const dot = el.querySelector(".status");
        const game = el.dataset.game;
        if (!dot) return;
        if (waitingPerGame[game] != "") dot.style.background = waitingPerGame[game]
            
        // dot.classList.toggle("online", !!waitingPerGame[game]);
        // console.log(`game=${game} waiting=${!!waitingPerGame[game]}`);
    });
});