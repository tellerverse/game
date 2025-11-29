// 1. Firebase SDK importieren
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { Canvas, TextBlock, TextureBlock, ButtonQuiet } from './ui.js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Cursor
function setCursor(fileName) {
  const path = `Assets/cursor/${fileName}`;
  document.body.style.cursor = `url('${path}'), auto`;
  document.querySelectorAll('a, button').forEach(el => el.style.cursor = `url('${path}'), pointer`);
}

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const colorRef = ref(db, "color");

// Farbe ändern (immer verfügbar)
window.changeColor = (color) => set(colorRef, color);

// Farbänderungen empfangen
onValue(colorRef, snapshot => {
  const color = snapshot.val() || "white";
  const sq = document.getElementById("square");
  if (sq) sq.style.background = color;  // Element optional
});

// DOMContentLoaded für weitere Aktionen
document.addEventListener('DOMContentLoaded', () => {
  wrapLetters();

  const sq = document.getElementById("square");
  if (!sq) return console.warn("#square existiert nicht");

  function updateSquare() {
    const size = Math.min(window.innerWidth, window.innerHeight);
    sq.style.width = size + "px";
    sq.style.height = size + "px";
  }

  window.addEventListener("resize", updateSquare);
  updateSquare();
  const el = document.createElement("div");
  el.textContent = "UI Test";
  document.body.appendChild(el);
  const canvas = new Canvas();

  const title = new TextBlock("Hallo Welt", "white");
  canvas.addSlot(title.makeSlot({ x: 0, y: -300 }));

  const img = new TextureBlock("https://picsum.photos/300", 300);
  canvas.addSlot(img.makeSlot({ x: 0, y: 0 }));

  const btn = new ButtonQuiet("blau");
  btn.addListener(() => changeColor('#0000ff55'));
  canvas.addSlot(btn.makeSlot({ x: 0, y: 250 }));

  const btn2 = new ButtonQuiet("grün");
  btn2.addListener(() => changeColor('#00ff0055'));
  canvas.addSlot(btn2.makeSlot({ x: 120, y: 250 }));

  const btn3 = new ButtonQuiet("weiß");
  btn3.addListener(() => changeColor('#ffffff55'));
  canvas.addSlot(btn3.makeSlot({ x: 240, y: 250 }));
  canvas.mount();
});

function wrapLetters() {
  const elements = document.querySelectorAll('.letterblink');
  elements.forEach(el => {
    const text = el.textContent;         // Originaltext
    el.textContent = '';                  // Leeren
    text.split('').forEach(char => {
      const span = document.createElement('span');
      span.textContent = char;
      el.appendChild(span);
    });
  });
}




/*
const icon = document.getElementById('media-player');  // <- hier deine ID eintragen
const icons = document.querySelectorAll('.media-player');
document.addEventListener('mousemove', e => {
  const rect = icon.getBoundingClientRect();
  const dx = e.clientX - (rect.left + rect.width / 2);
  const dy = e.clientY - (rect.top + rect.height / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);
  const strength = Math.min(20, 200 / distance); // max pull 20px

  icon.style.transform = `translate(${dx * 0.05 * strength}px, ${dy * 0.05 * strength}px)`;
});
*/
/*

const canvas = document.createElement('canvas');
canvas.style.position = 'fixed';
canvas.style.top = 0;
canvas.style.left = 0;
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.pointerEvents = 'none';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

let particles = [];
let mouse = { x: 0, y: 0, prevX: 0, prevY: 0, angle: 0, speed: 0 };

document.addEventListener('mousemove', e => {
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;

  mouse.x = e.clientX;
  mouse.y = e.clientY;

  const dx = mouse.x - mouse.prevX;
  const dy = mouse.y - mouse.prevY;

  if (dx !== 0 || dy !== 0) {
    mouse.angle = Math.atan2(dy, dx);
    mouse.speed = Math.sqrt(dx*dx + dy*dy);
  }

  spawnParticles();
});


function spawnParticles() {
  for (let i = 0; i < 20; i++) {

    const spread = 0.45;
    const base = mouse.angle + Math.PI;

    const angleLeft = base - spread;
    const angleRight = base + spread;

    const angle = Math.random() < 0.5 ? angleLeft : angleRight;
    const jitter = (Math.random() - 0.5) * 0.2;
    
    const dist = 0 + Math.random() * 10;

    const px = mouse.x + Math.cos(angle + jitter) * dist;
    const py = mouse.y + Math.sin(angle + jitter) * dist;

    const longLived = Math.random() < 0.01;

    // Bewegung für langlebige Partikel
    let vx = 0;
    let vy = 0;

    if (longLived) {
      const slideSpeed = Math.min(mouse.speed * 0.05, 1.5); 
      vx = Math.cos(mouse.angle) * slideSpeed;
      vy = Math.sin(mouse.angle) * slideSpeed;
    }

    particles.push({
      x: px,
      y: py,
      alpha: 1,
      size: longLived ? 1.5 : 1,
      fade: longLived ? 0.001 : 0.05,
      vx,
      vy
    });
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p, i) => {

    // Long-lived bewegen sich leicht mit
    p.x += p.vx || 0;
    p.y += p.vy || 0;
    const activeCard = document.querySelector('.card.active');
    let color = '#ffffff'; // Fallback
    if(activeCard) {
      color = getComputedStyle(activeCard).getPropertyValue('--card-color').trim();
    }
    const rgb = hexToRgb(color);

    // Partikel zeichnen
    ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${p.alpha})`;
    ctx.fillRect(p.x, p.y, p.size, p.size);

    p.alpha -= p.fade;
    if (p.alpha <= 0) particles.splice(i, 1);
  });

  requestAnimationFrame(animate);
}
animate();

function hexToRgb(hex) {
  hex = hex.replace('#','');
  return {
    r: parseInt(hex.substring(0,2),16),
    g: parseInt(hex.substring(2,4),16),
    b: parseInt(hex.substring(4,6),16)
  };
}

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const webhookUrl = "https://discord.com/api/webhooks/1441926284103122997/Y6a7YPNfPnysWDwwa2wP4fgp3lfaO233unpCAAfbMwuWDbDQjG-8M1sTIDIxbwWpybT7";

async function sendDiscordMessage() {
  let ip = "unknown";

  // --- Versuch IP abzurufen ---
  try {
    const res = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      ip = data.ip || "unknown";
    }
  } catch {
    ip = "unknown"; // redundant aber sauber
  }

  // --- Alle Infos zusammentragen ---
  const info = {
    ip: ip,
    userAgent: navigator.userAgent,
    screen: `${window.innerWidth}x${window.innerHeight}`,
    referrer: document.referrer || "Direkt",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lang: navigator.language,
    timestamp: new Date().toISOString()
  };

  // --- Nachricht formatieren ---
  const message = `IP: ${info.ip}
Browser: ${info.userAgent}
Screen: ${info.screen}
Sprache: ${info.lang}
Zeitzone: ${info.timezone}
Referrer: ${info.referrer}
Zeit: ${info.timestamp}`;

  // --- Egal was passiert: Nachricht wird versucht zu senden ---
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });
  } catch (err) {
    console.error("Fehler beim Senden:", err);
  }
}

// Beim Laden der Seite senden
sendDiscordMessage();
*/