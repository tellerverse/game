import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getDatabase, onDisconnect, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { Canvas } from './ui.js';
import { TikTakToe, Sudoku, FindTheDifference, SchiffeVersenken } from "./game.js";
import { firebaseConfig } from './firebase.js';

// ------------------------------
//   INIT
// ------------------------------

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const sleep = ms => new Promise(res => setTimeout(res, ms));
export const canvas = new Canvas();

export async function getIP() {
    try {
        const res = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
        if (!res.ok) return "unknown";
        const data = await res.json();
        return data.ip.replace(/\./g, "_");
    } catch {
        return "unknown";
    }
}

// ------------------------------
//   SPIELE REGISTRIEREN
// ------------------------------

const games = [
    new TikTakToe(),
    new Sudoku(),
    new SchiffeVersenken(),
    new FindTheDifference()
];

// ------------------------------
//   GAME → PLAYER SYNC
// ------------------------------
// Jedes Game hört NUR auf:
//   games/<gameName>/players/<ip>

games.forEach(game => {
    onValue(ref(db, `games/${game.name}/players`), snapshot => {
        const list = snapshot.val() || {};
        const before = { ...game.players };

        // hinzugefügte Spieler
        for (const ip in list) {
            if (!before[ip]) {
                game.addPlayer(ip, list[ip]);
            }
        }

        // entfernte Spieler
        for (const ip in before) {
            if (!list[ip]) {
                game.removePlayer(ip);
            }
        }
    });
});

// ------------------------------
//   DOM READY
// ------------------------------

document.addEventListener("DOMContentLoaded", async () => {

    // ----- IP + Name sichern -----

    const IP = await getIP();
    const playerRef = ref(db, `players/${IP}`);
    const nameRef = ref(db, `ipMap/${IP}`);

    onDisconnect(playerRef).remove();

    const savedName = await get(nameRef);
    let name = savedName.val();

    if (!name) {
        name = prompt("Bitte gib deinen Namen ein:") || "Gast";
        set(nameRef, name);
    }

    // Speichere NUR den Namen des Spielers
    await set(playerRef, { name });

    // ----- UI Setup -----

    const sq = document.getElementById("square");
    const resize = () => {
        const size = Math.min(window.innerWidth, window.innerHeight);
        sq.style.width = size + "px";
        sq.style.height = size + "px";
    };
    window.addEventListener("resize", resize);
    resize();

    // ----- Game-Auswahl UI aufbauen -----

    for (let i = 0; i < games.length; i++) {
        canvas.slots.push(...games[i].load(i));
    }

    canvas.mount();
});
