// import { Canvas, TextBlock, TextureBlock, ColorBlock, ButtonQuiet } from './ui.js';
import { getDatabase, onDisconnect, ref, onValue, set, push , get, remove } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { firebaseConfig } from './firebase.js';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

class game {
    constructor() {
        this.id = "error";
        this.info = {};
        this.sessions = [];
        // this.Init()
    }

    async Init() {
        const Info = await get(ref(db, `games/${this.id}/info`));
        this.info = {
            PlayerAmount: Info.PlayerAmount,
            Color: Info.Color
        }
    }

    setSession(index, data) {
        set(ref(db, `games/${this.id}/sessions/${index}`), data);
        this.sessions[index] = data
        if (data.endsession) {
            location.href = "../";
            this.end();
            console.log(`end session ${index}`)
        }
    }

    addSession(data) {
        const newindex = this.sessions.length
        set(ref(db, `games/${this.id}/sessions/${newindex}`), data);
        this.sessions[newindex] = data
        onValue(ref(db, `games/${this.id}/sessions/${newindex}`), snap => {
            if (snap.exists() && Object.keys(snap.val().players).length == this.playerAmount) {
                document.getElementsByClassName("loading").style.display = "none";
                // this.initUI();
            }
            console.log(`new data for ${this.id} session ${newindex}`)
        });
    }

    async start() {
        
    }

    async addPlayer(ip) {
      const sessionsRef = ref(db, `games/${this.id}/sessions`);
      const sessionsSnap = await get(sessionsRef);

      let targetIndex = null;
      let sessions = sessionsSnap.exists() ? sessionsSnap.val() : [];

      // 1. freie Session suchen
      for (let i = 0; i < sessions.length; i++) {
        const players = sessions[i]?.players ?? {};
        if (Object.keys(players).length < this.playerAmount) {
          targetIndex = i;
          break;
        }
      }

      // 2. keine freie Session → neue erstellen
      if (targetIndex === null) {
        targetIndex = sessions.length;
        await set(ref(db, `games/${this.id}/sessions/${targetIndex}`), {
          players: {},
          started: false
        });
      }

      // 3. Spieler hinzufügen
      const playersRef = ref(db, `games/${this.id}/sessions/${targetIndex}/players`);
      await push(playersRef, ip);

      // 4. prüfen ob Session jetzt voll ist
      const updatedSnap = await get(playersRef);
      const count = Object.keys(updatedSnap.val()).length;

      if (count >= this.playerAmount) {
        await set(
          ref(db, `games/${this.id}/sessions/${targetIndex}/started`),
          true
        );
        this.start(targetIndex);
      }
    }


    end() {
        const remaining = Object.values(this.players);
        this.playerNames.forEach((block, i) => { block.setText(remaining[i] ?? "");});
    }
}

export class TikTakToe extends game {
//     constructor() {
//         super();
//         this.playerAmount = 2;
//         this.name = "TikTakToe";
//         this.imagedata = {image: "Assets/tiktaktoe.png", size: 30};
//         this.gameUI = { Can: new Canvas(), blocks: Array.from({ length: 9 }, () => ({
//             image: new TextureBlock("Assets/load.png", 120, 0),
//             button: new ButtonQuiet("", 120, 120, 0, 0, 40, "#00000000", false)
//         })) };
//     }

//     load(i) {
//         return super.load(i);
//     }

//     async start() {
//         const path = ref(db, `games/${this.name}`);
//         const snap = await get(path);

//         // Spielfeld initialisieren
//         if (!snap.exists()) {
//             await set(path, {
//                 board: "000000000",
//                 turn: "X",     // X beginnt
//                 players: {}    // IPs werden später eingetragen
//             });
//         }

//         super.start();
//     }

//     // Spieler X/O zuweisen
//     addPlayer(ip, name) {
//         super.addPlayer(ip, name);

//         const keys = Object.keys(this.players);
//         const symbol = keys.length === 1 ? "X" : "O";

//         set(ref(db, `games/${this.name}/players/${symbol}`), ip);
//         set(ref(db, `games/${this.name}/board`), "000000000");
//         set(ref(db, `games/${this.name}/turn`), "X");
//     }

//     initUI() {
//         // this.gameUI.board = new ColorBlock("red", 80, 10);
//         this.gameUI.board = new TextureBlock("Assets/bg3.png", 675, 10);
//         this.gameUI.Can.slots = [
//             this.gameUI.board.makeSlot({ x: 0, y: 0 }),
//             ...Array.from({ length: 9 }, (_, i) => {
//                 const pos = { x: -250 + (i % 3) * 250, y: -250 + Math.floor(i / 3) * 250 };
//                 return [
//                     this.gameUI.blocks[i].button.makeSlot(pos),
//                     this.gameUI.blocks[i].image.makeSlot(pos)
//                 ];
//             }).flat()
//         ];
//         this.gameUI.Can.mount();
//         this.gameUI.blocks.forEach((blockObj, index) => {
//             blockObj.image.setVisibility(false);
//             blockObj.button.addListener(async () => {
//                 if (this.blocked) return;
//                 this.blocked = true;
//                 const ip = await getIP();
//                 const snap = await get(ref(db, `games/${this.name}`));
//                 const board = snap.val().board;
//                 const players = snap.val().players;

//                 let mySymbol = players.X === ip ? "X" : "O";
//                 if (snap.val().turn !== mySymbol || board[index] !== "0") {this.blocked = false; return};
//                 await set(ref(db, `games/${this.name}`), {
//                     board: board.substring(0, index) + mySymbol + board.substring(index + 1),
//                     turn: snap.val().turn === "X" ? "O" : "X",
//                     players
//                 });
//                 this.blocked = false;
//             });
//         });

//         onValue(ref(db, `games/${this.name}`), snapshot => {
//             if (!snapshot.val() || !snapshot.val().board) return;
//             const board = snapshot.val().board;
//             for (let i = 0; i < 9; i++) {
//                 const img = this.gameUI.blocks[i].image;
//                 if (board[i] === "0") {
//                     img.setVisibility(false);
//                 } else {
//                     img.setVisibility(true);
//                     img.setImage(board[i] === "X" ? "Assets/Cross.png" : "Assets/Circle.png");
//                 }
//             }
//         });
//     }
// }
    constructor() {
        super();
        this.id = "TikTakToe";
    }

    load(i) {
        return super.load(i);
    }
}

export class Sudoku extends game {
    constructor() {
        super();
        this.id = "Sudoku";
    }

    load(i) {
        return super.load(i);
    }
}

export class SchiffeVersenken extends game {
    constructor() {
        super();
        this.id = "Schiffe Versenken";
    }

    load(i) {
        return super.load(i);
    }
}

export class FindTheDifference extends game {
    constructor() {
        super();
        this.id = "Find the Difference";
    }

    load(i) {
        return super.load(i);
    }
}