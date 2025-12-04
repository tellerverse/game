// // =====================
// //   CORE GAME SYSTEM
// // =====================
import { Canvas, TextBlock, TextureBlock, ColorBlock, ButtonQuiet } from './ui.js';
import { getDatabase, onDisconnect, ref, onValue, set, push , get, remove } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getIP, sleep, canvas } from './script.js';
import { firebaseConfig } from './firebase.js';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

class game {
    constructor() {
        this.name = "Generic Game";
        this.playerAmount = 2;
        this.element = null;
        this.btn = new ButtonQuiet("", 220, 220, 20, 50);
        this.caption = new TextBlock("", "white", 80, "center", { x: 0.5, y: 0.0 });
        this.texture = new TextureBlock("", 60, 0); //new TextBlock("hey", "white", 80, "center", { x: 0.5, y: 0.0 });
        this.imagedata = {image: "https://picsum.photos/60", size: 20};
        this.playerNames = [new TextBlock("", "#ffaaaa", 80, "center", { x: 0.5, y: 1.0 }), new TextBlock("", "#ffaaaa", 80, "center", { x: 0.5, y: 1.0 })];
        this.players = {};
        this.gameUI = new Canvas();
    }

    initUI() {
        console.log("No UI initialized for this game.");
        return [];
    }

    async start() {
        set(ref(db, `players/${await getIP()}/gameState`), "playing");
        this.btn.disable();
        // await sleep(3000);
        canvas.setVisibility(false);
        this.initUI();
    }

    load(i) {
        const pos = { x: i < 2 ? -250 : 250, y: [1, 3].includes(i)? -250 : 250 }
        this.btn.addListener(() => this.tryRegister());
        this.caption.setText(this.name);
        this.texture.image = this.imagedata.image;
        this.texture.size = this.imagedata.size;
        return [this.texture.makeSlot({ x: pos.x + (i < 2 ? -170 : 170), y: pos.y + 170, width: this.imagedata.size, height: this.imagedata.size }), this.caption.makeSlot({ x: pos.x, y: pos.y - 200 }), ...this.playerNames.map(p => p.makeSlot({ x: pos.x, y: pos.y + 220 - (this.playerNames.indexOf(p) * 70) })), this.btn.makeSlot(pos)];
    }

    async tryRegister() {
        const ip = await getIP();
        const snap = await get(ref(db, `players/${ip}/gameState`));
        console.log(snap.val());

        if (snap.val() === "none") await set(ref(db, `players/${ip}/game`), this.caption.text);
    }

    addPlayer(ip, name) {
        this.players[ip] = name;
        this.playerNames[Object.keys(this.players).length - 1].setText(name);
        if (Object.keys(this.players).length >= this.playerAmount) this.start();
    }

    removePlayer(ip) {
        delete this.players[ip];
        const remaining = Object.values(this.players);
        this.playerNames.forEach((block, i) => { block.setText(remaining[i] ?? "");});
    }
}

export class TikTakToe extends game {
    constructor() {
        super();
        this.playerAmount = 2;
        this.name = "TikTakToe";
        this.imagedata = {image: "Assets/tiktaktoe.png", size: 30};
        this.gameUI = { Can: new Canvas(), blocks: Array.from({ length: 9 }, () => ({
            image: new TextureBlock("Assets/load.png", 120, 0),
            button: new ButtonQuiet("", 120, 120, 0, 0, 40, "#00000000", false)
        })) };
    }

    load(i) {
        return super.load(i);
    }

    async start() {
        const path = ref(db, `games/${this.name}`);
        const snap = await get(path);

        // Spielfeld initialisieren
        if (!snap.exists()) {
            await set(path, {
                board: "000000000",
                turn: "X",     // X beginnt
                players: {}    // IPs werden später eingetragen
            });
        }

        super.start();
    }

    // Spieler X/O zuweisen
    addPlayer(ip, name) {
        super.addPlayer(ip, name);

        const keys = Object.keys(this.players);
        const symbol = keys.length === 1 ? "X" : "O";

        set(ref(db, `games/${this.name}/players/${symbol}`), ip);
        set(ref(db, `games/${this.name}/board`), "000000000");
        set(ref(db, `games/${this.name}/turn`), "X");
    }

    initUI() {
        // this.gameUI.board = new ColorBlock("red", 80, 10);
        this.gameUI.board = new TextureBlock("Assets/bg3.png", 675, 10);
        this.gameUI.Can.slots = [
            this.gameUI.board.makeSlot({ x: 0, y: 0 }),
            ...Array.from({ length: 9 }, (_, i) => {
                const pos = { x: -250 + (i % 3) * 250, y: -250 + Math.floor(i / 3) * 250 };
                return [
                    this.gameUI.blocks[i].button.makeSlot(pos),
                    this.gameUI.blocks[i].image.makeSlot(pos)
                ];
            }).flat()
        ];
        this.gameUI.Can.mount();
        this.gameUI.blocks.forEach((blockObj, index) => {
            blockObj.image.setVisibility(false);
            blockObj.button.addListener(async () => {
                if (this.blocked) return;
                this.blocked = true;
                const ip = await getIP();
                const snap = await get(ref(db, `games/${this.name}`));
                const board = snap.val().board;
                const players = snap.val().players;

                let mySymbol = players.X === ip ? "X" : "O";
                if (snap.val().turn !== mySymbol || board[index] !== "0") {this.blocked = false; return};
                await set(ref(db, `games/${this.name}`), {
                    board: board.substring(0, index) + mySymbol + board.substring(index + 1),
                    turn: "X" ? "O" : "X",
                    players
                });
                this.blocked = false;
            });
        });

        onValue(ref(db, `games/${this.name}`), snapshot => {
            if (!snapshot.val() || !snapshot.val().board) return;
            const board = snapshot.val().board;
            for (let i = 0; i < 9; i++) {
                const img = this.gameUI.blocks[i].image;
                if (board[i] === "0") {
                    img.setVisibility(false);
                } else {
                    img.setVisibility(true);
                    img.setImage(board[i] === "X" ? "Assets/Cross.png" : "Assets/Circle.png");
                }
            }
        });
    }
}


export class Sudoku extends game {
    constructor() {
        super();
        this.name = "Sudoku";
        this.imagedata = {image: "Assets/sudoku.png", size: 30};
    }

    load(i) {
        return super.load(i);
    }
}

export class SchiffeVersenken extends game {
    constructor() {
        super();
        this.name = "Schiffe Versenken";
        this.imagedata = {image: "Assets/ship.png", size: 60};
    }

    load(i) {
        return super.load(i);
    }
}

export class FindTheDifference extends game {
    constructor() {
        super();
        this.name = "Find the Difference";
        this.imagedata = {image: "Assets/search.png", size: 30};
    }

    load(i) {
        return super.load(i);
    }
}