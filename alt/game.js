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
      set(ref(db, `players/${await getIP()}`), {
        game: this.name,
        gameState: "waiting"
      });

      onValue(ref(db, `games/${this.name}/players`), snap => {
        if (snap.exists() && Object.keys(snap.val()).length >= this.playerAmount) {
          document.getElementById("loading").style.display = "none";
          this.initUI();
        }
      });
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
                    turn: snap.val().turn === "X" ? "O" : "X",
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
        this.imagedata = { image: "Assets/ship.png", size: 60 };

        this.size = 10;

        this.gameUI = {
            Can: new Canvas(),
            myGrid: Array.from({ length: 100 }, () => ({
                image: new TextureBlock("", 80, 5),
            })),
            enemyGrid: Array.from({ length: 100 }, () => ({
                image: new TextureBlock("", 80, 5),
                button: new ButtonQuiet("", 80, 80, 0, 0, 1, "#00000000")
            }))
        };
    }

    // UI laden
    load(i) { return super.load(i); }

    // Spieler hinzu
    async addPlayer(ip, name) {
        super.addPlayer(ip, name);
        const keys = Object.keys(this.players);

        const symbol = keys.length === 1 ? "A" : "B";

        await set(ref(db, `games/${this.name}/players/${symbol}`), ip);

        // Erste Initialisierung des Game-Objekts
        if (keys.length === 1) {
            await set(ref(db, `games/${this.name}`), {
                players: { [symbol]: ip },
                boards: {},
                shots: { A: "", B: "" },
                turn: "A"
            });
        }

        if (keys.length === 2) {
            const path = ref(db, `games/${this.name}/boards`);

            const boards = {
                A: this.generateBoard(),
                B: this.generateBoard(),
            };
            await set(path, boards);
        }
    }

    generateBoard() {
        // 10x10 – Random Schiffe für minimale Implementierung
        let board = Array(100).fill(0);

        const ships = [5,4,3,3,2];

        const rnd = max => Math.floor(Math.random()*max);

        for (let ship of ships) {
            let placed = false;
            while (!placed) {
                let dir = rnd(2); // 0 horizontal, 1 vertikal
                let x = rnd(10);
                let y = rnd(10);
                let ok = true;

                for (let i = 0; i < ship; i++) {
                    let nx = x + (dir === 0 ? i : 0);
                    let ny = y + (dir === 1 ? i : 0);

                    if (nx >= 10 || ny >= 10) { ok = false; break; }

                    if (board[ny * 10 + nx] === 1) { ok = false; break; }
                }

                if (!ok) continue;

                for (let i = 0; i < ship; i++) {
                    let nx = x + (dir === 0 ? i : 0);
                    let ny = y + (dir === 1 ? i : 0);
                    board[ny * 10 + nx] = 1;
                }

                placed = true;
            }
        }

        return board.join("");
    }

    async start() {
        set(ref(db, `players/${await getIP()}/gameState`), "playing");
        this.btn.disable();
        canvas.setVisibility(false);
        this.initUI();
    }

    initUI() {
        const gridOffset = 250;

        this.gameUI.Can.slots = [
            // eigenes Board
            ...this.gameUI.myGrid.map((g, i) => {
                const pos = {
                    x: -gridOffset + (i % 10) * 50,
                    y: -250 + Math.floor(i / 10) * 50
                };
                return g.image.makeSlot(pos);
            }),

            // Gegnerboard
            ...this.gameUI.enemyGrid.map((g, i) => {
                const pos = {
                    x: gridOffset + (i % 10) * 50,
                    y: -250 + Math.floor(i / 10) * 50
                };
                return [
                    g.button.makeSlot(pos),
                    g.image.makeSlot(pos)
                ];
            }).flat()
        ];

        this.gameUI.Can.mount();
        this.bindInput();
        this.startSync();
    }

    bindInput() {
        this.gameUI.enemyGrid.forEach((cell, index) => {
            cell.button.addListener(async () => {
                const ip = await getIP();
                const snap = await get(ref(db, `games/${this.name}`));
                const players = snap.val().players;
                const turn = snap.val().turn;
                const shots = snap.val().shots;

                let me = players.A === ip ? "A" : "B";
                let enemy = me === "A" ? "B" : "A";

                if (turn !== me) return;

                if (shots[me].includes(index + ",")) return;

                shots[me] += index + ",";

                await set(ref(db, `games/${this.name}/shots`), shots);
                await set(ref(db, `games/${this.name}/turn`), enemy);
            });
        });
    }

    startSync() {
        onValue(ref(db, `games/${this.name}`), snapshot => {
            const data = snapshot.val();
            if (!data) return;

            const ip = JSON.parse(localStorage.getItem("cachedIP") || "\"\"") || "";
            let me = data.players.A === ip ? "A" : "B";
            let enemy = me === "A" ? "B" : "A";

            const myBoard = data.boards?.[me] || "";
            const enemyBoard = data.boards?.[enemy] || "";

            const myShots = data.shots?.[enemy] || "";
            const enemyShots = data.shots?.[me] || "";

            // eigenes Board
            for (let i = 0; i < 100; i++) {
                const img = this.gameUI.myGrid[i].image;
                if (myBoard[i] === "1" && enemyShots.includes(i + ",")) {
                    img.setImage("Assets/hit.png");
                    img.setVisibility(true);
                } else if (enemyShots.includes(i + ",")) {
                    img.setImage("Assets/miss.png");
                    img.setVisibility(true);
                } else if (myBoard[i] === "1") {
                    img.setImage("Assets/ship.png");
                    img.setVisibility(true);
                } else {
                    img.setVisibility(false);
                }
            }

            // gegner Board (nur Treffer/Fehlschüsse)
            for (let i = 0; i < 100; i++) {
                const img = this.gameUI.enemyGrid[i].image;

                if (myShots.includes(i + ",")) {
                    if (enemyBoard[i] === "1") {
                        img.setImage("Assets/hit.png");
                        img.setVisibility(true);
                    } else {
                        img.setImage("Assets/miss.png");
                        img.setVisibility(true);
                    }
                } else {
                    img.setVisibility(false);
                }
            }

            this.checkWin(data);
        });
    }

    checkWin(data) {
        const boards = data.boards;
        const shots = data.shots;

        if (!boards) return;
        if (!shots) return;

        const allHit = (enemyBoard, myShots) => {
            for (let i = 0; i < 100; i++) {
                if (enemyBoard[i] === "1" && !myShots.includes(i + ",")) {
                    return false;
                }
            }
            return true;
        };

        const AWin = allHit(boards.B, shots.A);
        const BWin = allHit(boards.A, shots.B);

        if (AWin) alert("Spieler A gewinnt!");
        if (BWin) alert("Spieler B gewinnt!");
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