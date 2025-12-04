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
        this.btn.disable();
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
        const nameSnap = await get(ref(db, `players/${ip}/name`));
        const playerName = nameSnap.val() || "Unbekannt";

        // Spieler ins Game eintragen
        await set(
            ref(db, `games/${this.name}/players/${ip}`),
            playerName
        );
    }

    addPlayer(ip, name) {
        this.players[ip] = name;

        const idx = Object.keys(this.players).length - 1;
        if (this.playerNames[idx]) {
            this.playerNames[idx].setText(name);
        }

        if (Object.keys(this.players).length === this.playerAmount) {
            this.start();
        }
    }


    removePlayer(ip) {
        delete this.players[ip];

        const names = Object.values(this.players);
        this.playerNames.forEach((p, idx) => {
            p.setText(names[idx] || "");
        });
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

        // Spielfeld initialisieren
        if (!snap.exists()) {
            await set(path, {
                board: ".........",
                turn: "X",     // X beginnt
                players: {}    // IPs werden später eingetragen
            });
        }

        await super.start();

        onValue(ref(db, `games/${this.name}`), snapshot => {
            if (!this.gameUI.blocks) return;

            const data = snapshot.val();
            if (!data) return;

            const board = data.board;

            for (let i = 0; i < 9; i++) {
                const symbol = board[i];
                const img = this.gameUI.blocks[i].image;

                if (symbol === "0") {
                    img.setVisibility(false);
                } else {
                    img.setVisibility(true);
                    img.image = symbol === "X" ? "Assets/tower.png" : "Assets/horse.png";
                }
            }
        });
    }

    // Spieler X/O zuweisen
    addPlayer(ip, name) {
        super.addPlayer(ip, name);

        const players = Object.keys(this.players);

        const symbol = players.length === 1 ? "X" : "O";

        set(
            ref(db, `games/${this.name}/symbols/${symbol}`),
            ip
        );
    }

    initUI() {
        this.gameUI.board = new ColorBlock("red", 80, 10);
        this.gameUI.blocks = Array.from({ length: 9 }, () => {
            return {
                image: new TextureBlock("Assets/tower.png", 120, 0),
                button: new ButtonQuiet("", 120, 120, 0, 0)
            };
        });

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

        // Buttons konfigurieren
        this.gameUI.blocks.forEach((blockObj, index) => {

            blockObj.image.setVisibility(false);

            blockObj.button.addListener(async () => {
                const ip = await getIP();

                const snap = await get(ref(db, `games/${this.name}`));
                const data = snap.val();

                const board = data.board;
                const turn = data.turn;
                const players = data.players;

                // ermitteln, ob du X oder O bist
                let mySymbol = null;
                if (players.X === ip) mySymbol = "X";
                if (players.O === ip) mySymbol = "O";

                // Sicherheitsabbruch – du bist nicht im game
                if (!mySymbol) return;

                // --- WICHTIG: Nicht dein Zug → blocken ---
                if (turn !== mySymbol) return;

                // Feld belegt?
                if (board[index] !== "0") return;

                // Board aktualisieren
                const newBoard =
                    board.substring(0, index) +
                    mySymbol +
                    board.substring(index + 1);

                const nextTurn = mySymbol === "X" ? "O" : "X";

                // Firebase updaten
                await set(ref(db, `games/${this.name}`), {
                    board: newBoard,
                    turn: nextTurn,
                    players
                });
            });
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