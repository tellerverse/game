import { games } from '../script/script.js';
import { getIP } from '../utils.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { db } from '../firebasedata.js';

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

const sessionRef = ref(db, `games/${gameName}/sessions`);

onValue(sessionRef, snap => {
    const sessions = snap.val();
    if (!sessions) return;

    for (const [sessionId, session] of Object.entries(sessions)) {
        if (!session.started) continue;
        if (!session.players) continue;

        // Prüfen ob ICH in dieser Session bin
        if (Object.values(session.players).includes(IP)) {
            location.href = `${gameName}?session=${sessionId}`;
        }
    }
});
