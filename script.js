import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getDatabase, onDisconnect, ref, onValue, set, push , get, remove } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { Canvas, TextBlock, TextureBlock, ButtonQuiet } from './ui.js';

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
onValue(ref(db, "players"), snapshot => {
  const now = Date.now();
  const players = snapshot.val() || {};
  for (const key in players) {
    if (now - (players[key].lastSeen || 0) > 15000) { // 15 Sekunden Inaktivität
      remove(ref(db, `players/${key}`));
    }
  }
});
setInterval(async () => {
  set(ref(db, `players/${await getIP()}/lastSeen`), Date.now());
}, 5000); // alle 5 Sekunden

async function getIP() {
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
  // Setze den Spieler in die DB
  set(ref(db, `players/${await getIP()}/lastSeen`), Date.now());
  set(ref(db, `players/${await getIP()}/Name`), "Moritz");

  // Stelle sicher, dass er automatisch entfernt wird, wenn die Verbindung abbricht
  onDisconnect(ref(db, `players/${await getIP()}`)).remove();

  const sq = document.getElementById("square");
  function updateSquare() {
    const size = Math.min(window.innerWidth, window.innerHeight);
    sq.style.width = size + "px";
    sq.style.height = size + "px";
  }
  window.addEventListener("resize", updateSquare);
  updateSquare();
  
  const canvas = new Canvas();

  const title = new TextBlock("Hallo Welt", "white");
  canvas.addSlot(title.makeSlot({ x: 0, y: -300 }));

  const img = new TextureBlock("https://picsum.photos/300", 300);
  canvas.addSlot(img.makeSlot({ x: 0, y: 0 }));

  const btn = new ButtonQuiet("blau");
  btn.addListener(() => changeColor('#0000ff'));
  canvas.addSlot(btn.makeSlot({ x: 0, y: 250 }));

  const btn2 = new ButtonQuiet("grün");
  btn2.addListener(() => set(color, "#00ff00"));
  canvas.addSlot(btn2.makeSlot({ x: 120, y: 250 }));

  const btn3 = new ButtonQuiet("red");
  btn3.addListener(() => set(color, "#ff0000"));
  canvas.addSlot(btn3.makeSlot({ x: 240, y: 250 }));
  canvas.mount();
});