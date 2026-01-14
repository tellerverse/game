export function lightenHex(hex, percent) {
    // Entferne #
    hex = hex.replace('#', '');

    // Prüfe auf RGBA (8 Zeichen) oder RGB (6 Zeichen)
    let r, g, b, a;
    if (hex.length === 8) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
        a = hex.slice(6, 8);
    } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
        a = '';
    } else {
        throw new Error('Ungültiger Hex-Code');
    }

    // Aufhellen
    r = Math.min(255, Math.floor(r + (255 - r) * percent));
    g = Math.min(255, Math.floor(g + (255 - g) * percent));
    b = Math.min(255, Math.floor(b + (255 - b) * percent));

    // Zurück zu Hex
    r = r.toString(16).padStart(2, '0');
    g = g.toString(16).padStart(2, '0');
    b = b.toString(16).padStart(2, '0');

    return `#${r}${g}${b}${a}`;
}

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

export function log(string) {
    const now = new Date();
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    set(ref(db, 'log'), string + ` ${mm}:${ss}`);

}