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
const games = [
  new TikTakToe(),
  new Sudoku(),
  new SchiffeVersenken(),
  new FindTheDifference()
];
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

onValue(ref(db, "color"), snapshot => {
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
  onDisconnect(playerRef).remove();
  const snap = await get(ipMapRef);
  let name = snap.val();

  if (!name) {
    name = prompt("Bitte gib deinen Namen ein:") || "Gast";
    set(ipMapRef, name);
  }
  set(ref(db, `players/${IP}/Name`), name);
  set(ref(db, `players/${IP}/game`), "none");

  const sq = document.getElementById("square");
  function updateSquare() {
    const size = Math.min(window.innerWidth, window.innerHeight);
    sq.style.width = size + "px";
    sq.style.height = size + "px";
  }
  window.addEventListener("resize", updateSquare);
  updateSquare();

  const canvas = new Canvas();

  // const players = await get(ref(db, "players"));
  // let i = 0;
  // for (const IP in players.val() || {}) {
  //   const player = players.val()[IP];
  //   const playerName = new ButtonQuiet(`${player.Name}`);
  //   canvas.addSlot(playerName.makeSlot({ x: 0, y: -250 + i * 20 }));
  //   i++;
  // }
  // const img = new TextureBlock("https://picsum.photos/100", 100);
  // canvas.addSlot(img.makeSlot({ x: 450, y: 450 }));

  
  for (let i = 0; i < 4; i++) {
    // if (games[i] != null) canvas.addSlot(games[i].load(i));
    if (games[i] != null) canvas.slots = [...canvas.slots, ...games[i].load(i)];
  }
  // let nameBtn = new ButtonQuiet(`Hallo ${name}`, 40, 60, 0, 50, 60, "#aaaaaa", false);
  // canvas.addSlot(nameBtn.makeSlot({ x: 0, y: 0, z: 100 }));
  canvas.mount();

  onValue(ref(db, "players"), async snapshot => {
    for (const game of games) {
      game.playerNames.forEach(p => p.setText(""));
      game.players = [];
    }
    for (const playerIP in snapshot.val() || {}) {
      const data = snapshot.val()[playerIP];
      if (!data || !data.game) return;

      const gameNames = ["TikTakToe", "Sudoku", "Schiffe Versenken", "Find the Difference"];
      const index = gameNames.indexOf(data.game);
      if (index === -1) return;

      const game = games[index];
      if (game) {
        game.register(await getIP());
      }
    }
  });

});