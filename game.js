// // =====================
// //   CORE GAME SYSTEM
// // =====================
import { Canvas, TextBlock, TextureBlock, ButtonQuiet } from './ui.js';
import { getDatabase, onDisconnect, ref, onValue, set, push , get, remove } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getIP } from './script.js';

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

class game {
    constructor() {
        this.element = null;
        this.btn = new ButtonQuiet("", 220, 220, 20, 50);
        this.caption = new TextBlock("", "white", 80, "center", { x: 0.5, y: 0.0 });
        this.playerNames = [new TextBlock("", "#ffaaaa", 80, "center", { x: 0.5, y: 1.0 }), new TextBlock("", "#ffaaaa", 80, "center", { x: 0.5, y: 1.0 })];
    }

    start() {
        
    }

    load(i) {
        const pos = { x: i < 2 ? -250 : 250, y: [1, 3].includes(i)? -250 : 250 }
        this.btn.addListener(() => this.register());
        return [this.caption.makeSlot({ x: pos.x, y: pos.y - 200 }), ...this.playerNames.map(p => p.makeSlot({ x: pos.x, y: pos.y + 200 - (this.playerNames.indexOf(p) * 70) })), this.btn.makeSlot(pos)];
    }

    async register() {
        const ip = await getIP();
        set(ref(db, `players/${ip}/game`), this.caption.text)
    }

    test() {
        this.caption.setText("Test");
    }
}

export class TikTakToe extends game {
    constructor() {
        super();
        this.caption.text = "TikTakToe";
    }

    load(i) {
        return super.load(i);
    }
}

export class Sudoku extends game {
    constructor() {
        super();
        this.caption.text = "Sudoku";

    }

    load(i) {
        return super.load(i);
    }
}

export class SchiffeVersenken extends game {
    constructor() {
        super();
        this.caption.text = "Schiffe Versenken";

    }

    load(i) {
        return super.load(i);
    }
}

export class FindTheDifference extends game {
    constructor() {
        super();
        this.caption.text = "Find the Difference";
        this.caption2 = new TextBlock("hey", "white", 80, "center", { x: 0.5, y: 0.0 });

    }

    load(i) {
        return [...super.load(i), this.caption2.makeSlot({ x: 250, y: -150 })];
    }
}
