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
        this.gameUI = { Can: new Canvas() };
    }

    load(i) {
        return super.load(i);
    }

    async start() {
        const path = ref(db, `games/${this.name}`);
        const snap = await get(path);

        if (!snap.exists()) {
            await set(path, "000000000");
        }

        super.start();
    }


    initUI() {
        this.gameUI.text = new TextBlock("hallo", "white", 80, "center", { x: 0.5, y: 0.5 });
        this.gameUI.board = new ColorBlock("red", 80, 10);
        this.gameUI.blocks = Array.from({ length: 9 }, (_, i) => {
            // const y = i - 1;
            return {image: new TextureBlock("Assets/tower.png", 120, 0), button: new ButtonQuiet("", 120, 120, 0, 0)};
        });
        this.gameUI.Can.slots = [
            this.gameUI.board.makeSlot({ x: 0, y: 0 }),
            ...Array.from({ length: 9 }, (_, i) => {
                const pos = { x: -250 + (i % 3) * 250, y: -250 + Math.floor(i / 3) * 250 };
                const res = [this.gameUI.blocks[i].button.makeSlot(pos), this.gameUI.blocks[i].image.makeSlot(pos)]
                // this.gameUI.blocks[i].image.image = Object.keys(this.players).length % 2 === 1 ? "Assets/tower.png" : "Assets/horse.png";

                return res;
                
            }).flat()
        ];
        this.gameUI.Can.mount();
        for (const block in this.gameUI.blocks) {
            this.gameUI.blocks[block].image.setVisibility(false);
            // this.gameUI.blocks[block].button.setVisibility(false);

            this.gameUI.blocks[block].button.addListener(async () => {
                console.log("clicked block " + block);
                this.gameUI.blocks[block].image.setVisibility(true);
                this.new = await get(ref(db, `games/${this.name}`));
                this.new = board.substring(0, block) 
                + (board.split("").filter(x => x !== "0").length % 2 === 0 ? "X" : "O")
                + board.substring(block + 1);

                set(ref(db, `games/${this.name}`), this.new);
            });
        }

        onValue(ref(db, `games/${this.name}`), snapshot => {
            const board = snapshot.val();
            if (!board) return; // wichtig

            for (let i = 0; i < board.length; i++) {
                if (board[i] !== "0") {
                    this.gameUI.blocks[i].image.setVisibility(true);
                    this.gameUI.blocks[i].image.image = board[i] === "X" ? "Assets/tower.png" : "Assets/horse.png";
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