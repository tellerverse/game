import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getDatabase, onDisconnect, ref, onValue, set, push , get, remove } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { Canvas, TextBlock, TextureBlock, ButtonQuiet } from './ui.js';
import { TikTakToe, Sudoku, FindTheDifference, SchiffeVersenken} from "./game.js";

const firebaseConfig = {
  apiKey: "AIzaSyBfT4NxPtu-ocx5lDntpV_U5f__-dpSiS8",
  authDomain: "gamevonwebsite.firebaseapp.com",
  databaseURL: "https://gamevonwebsite-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gamevonwebsite",
  storageBucket: "gamevonwebsite.firebasestorage.app",
  messagingSenderId: "718552016078",
  appId: "1:718552016078:web:3a50eb176071ad5b321c9f",
  measurementId: "G-L95ESZ482V"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const color = ref(db, "color");

window.changeColor = (newColor) => set(color, newColor);

onValue(color, snapshot => {
  const color = snapshot.val() || "white";
  const sq = document.getElementById("square");
  if (sq) sq.style.background = color;
});

// window.addEventListener("beforeunload", async (event) => {
//   remove(ref(db, `players/${await getIP()}`))
//     .then(() => console.log("Eintrag gelöscht"))
//     .catch(err => console.error(err));

// });

export async function getIP() {
  let ip = "unknown";
  try {
    const res = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      ip = data.ip || "unknown";
    }
  } catch {
    ip = "unknown";
  }
  return ip.replace(/\./g, "_");
}

document.addEventListener('DOMContentLoaded', async () => {
  const IP = await getIP();
  const playerRef = ref(db, `players/${IP}`);
  const ipMapRef = ref(db, `ipMap/${IP}`);

  // Spieler in die DB setzen
  onDisconnect(playerRef).remove();

  // Name aus der ipMap holen
  const snap = await get(ipMapRef);
  let name = snap.val();

  if (!name) {
    // Neuer Spieler: Name abfragen
    name = prompt("Bitte gib deinen Namen ein:") || "Gast";
    set(ipMapRef, name); // in ipMap speichern
  }

  // Name im Spieler-Eintrag speichern
  set(ref(db, `players/${IP}/Name`), name);

  // UI-Setup wie bisher
  const sq = document.getElementById("square");
  function updateSquare() {
    const size = Math.min(window.innerWidth, window.innerHeight);
    sq.style.width = size + "px";
    sq.style.height = size + "px";
  }
  window.addEventListener("resize", updateSquare);
  updateSquare();

  const canvas = new Canvas();
  const title = new TextBlock(`Hallo ${name}`, "white");
  canvas.addSlot(title.makeSlot({ x: 0, y: -300}));

  const players = await get(ref(db, "players"));
  let i = 0;
  for (const IP in players.val() || {}) {
    const player = players.val()[IP];
    const playerName = new ButtonQuiet(`${player.Name}`);
    canvas.addSlot(playerName.makeSlot({ x: 0, y: -250 + i * 20 }));
    i++;
  }
  const img = new TextureBlock("https://picsum.photos/100", 100);
  canvas.addSlot(img.makeSlot({ x: 450, y: 450 }));
  // const btn23 = new ButtonQuiet("", 500, 500, 0, 0);
  // btn23.addListener(() => set(color, "#ff0000"));
  // canvas.addSlot(btn23.makeSlot({ x: 0, y: 0 }));

  // const btn2 = new ButtonQuiet("", 250, 250, 0, 50);
  // btn2.addListener(() => set(color, "#00ff00"));
  // canvas.addSlot(btn2.makeSlot({ x: -250, y: -250 }));

  // const btn = new ButtonQuiet("", 250, 250, 0, 50);
  // btn.addListener(() => changeColor('#0000ff'));
  // canvas.addSlot(btn.makeSlot({ x: 250, y: -250 }));

  // const btn3 = new ButtonQuiet("", 250, 250, 0, 50);
  // btn3.addListener(() => canvas.setVisibility(false));
  // canvas.addSlot(btn3.makeSlot({ x: 250, y: 250 }));
  const games = [
    new TikTakToe(),
    new Sudoku(),
    new SchiffeVersenken(),
    new FindTheDifference()
  ]
  for (i = 0; i < 4; i++) {
    // if (games[i] != null) canvas.addSlot(games[i].load(i));
    if (games[i] != null) canvas.slots = [...canvas.slots, ...games[i].load(i)];
  }
  canvas.mount();
});