import { onDisconnect, ref, onValue, set, push , get, remove } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { db } from './firebasedata.js';
import { log } from './utils.js';

class game {
    constructor() {
        this.id = "error";
        this.info = {};
    }

    async init() {
        const info = await get(ref(db, `games/${this.id}/info`));
        this.info = {
            playerAmount: info.val().playerAmount,
            color: info.val().color
        }
    }

    async start(sessionid) {
        log(`${this.id} started`)
        set(ref(db, `games/${this.id}/sessions/${sessionid}/started`), true)
    }

    async addPlayer(ip) {
        const sessionsRootRef = ref(db, `games/${this.id}/sessions`);
        const sessionsSnap = await get(sessionsRootRef);

        for (const [sessionId, session] of Object.entries(sessionsSnap.val() || {})) {
            if (!session.players) {
                await remove(ref(db, `games/${this.id}/sessions/${sessionId}`));
            }
        }

        const freshSnap = await get(sessionsRootRef);

        let targetSessionId = null;
        for (const [sessionId, session] of Object.entries(freshSnap.val() || {})) {
            if (Object.keys(session.players || {}).length < this.info.playerAmount) {
                targetSessionId = sessionId;
                break;
            }
        }

        if (!targetSessionId) {
            const sessionsRef = ref(db, `games/${this.id}/sessions`);
            const sessionsSnap = await get(sessionsRef);
            const used = Object.keys(sessionsSnap.val() || {}).map(Number);
            let index = 0;
            while (used.includes(index)) index++;
            targetSessionId = index
            await set(ref(db, `games/${this.id}/sessions/${index}`), {
                players: {},
                started: false,
            });
        }

        const playersRef = ref(db, `games/${this.id}/sessions/${targetSessionId}/players`);
        const playersSnap = await get(playersRef);
        const used = Object.keys(playersSnap.val() || {}).map(Number);

        let index = 0;
        while (used.includes(index)) index++;

        const playerRef = ref(db, `games/${this.id}/sessions/${targetSessionId}/players/${index}`);
        await set(playerRef, ip);

        if (index +1 == this.info.playerAmount) this.start(targetSessionId)

        onDisconnect(playerRef).remove();
    }


    async end(sessionIndex) {
      await set(
        ref(db, `games/${this.id}/sessions/${sessionIndex}/ended`),
        true
      );
    }
}

export class Tik extends game {
    constructor() {
        super();
        this.id = "tik";
    }
}

export class Sudoku extends game {
    constructor() {
        super();
        this.id = "sudoku";
    }
}

export class Ship extends game {
    constructor() {
        super();
        this.id = "ship";
    }
}

export class Find extends game {
    constructor() {
        super();
        this.id = "find";
    }
}