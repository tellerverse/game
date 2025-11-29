// =====================
//   CORE WIDGET SYSTEM
// =====================

class Widget {
    constructor() {
        this.element = null;
    }

    render() {
        if (!this.element) this.element = document.createElement("div");
        return this.element;
    }

    makeSlot({ x=0, y=0, width="auto", height="auto", z=1 }) {
        return new CanvasSlot(this, { x, y, width, height, z });
    }
}


// =====================
//   CANVAS SLOT
//   -> Positioniert Widgets relativ zum Quadrat
// =====================

class CanvasSlot {
    constructor(widget, props) {
        this.widget = widget;
        this.props = props;
    }

    apply() {
        const el = this.widget.render();
        const { x, y, width, height } = this.props;

        const square = document.getElementById("square");
        const squareSize = square.offsetWidth;
        const baseSize = 1000;
        const scale = squareSize / baseSize;

        // --- Position
        const sx = x * scale;
        const sy = y * scale;

        el.style.position = "fixed";
        el.style.left = `calc(50% + ${sx}px)`;
        el.style.top  = `calc(50% + ${sy}px)`;
        el.style.transform = "translate(-50%, -50%)";
        el.style.zIndex = this.props.z + 10;

        // --- Size scaling
        if (width !== "auto") el.style.width = (parseFloat(width) * scale) + "px";
        if (height !== "auto") el.style.height = (parseFloat(height) * scale) + "px";

        // --- Font scaling
        const baseFont = el.dataset.baseFont || 20;
        el.style.fontSize = (baseFont * scale) + "px"; 

        // --- Padding / Border / Radius scaling (für Buttons)
        const basePaddingY = el.dataset.basePaddingY || 10;
        const basePaddingX = el.dataset.basePaddingX || 20;
        const baseBorder = el.dataset.baseBorder || 1;
        const baseRadius = el.dataset.baseRadius || 5;

        el.style.padding = `${basePaddingY * scale}px ${basePaddingX * scale}px`;
        el.style.borderWidth = (baseBorder * scale) + "px";
        el.style.borderRadius = (baseRadius * scale) + "px";

        // --- Special: Textures oder feste Größen
        if (el.dataset.baseSize) {
            const s = parseFloat(el.dataset.baseSize) * scale;
            el.style.width = s + "px";
            el.style.height = s + "px";
        }
    }
}


// =====================
//   CANVAS MANAGER
// =====================

export class Canvas {
    constructor() {
        this.slots = [];
        window.addEventListener("resize", () => this.update());
    }

    addSlot(slot) {
        this.slots.push(slot);
    }

    mount() {
        // for (const slot of this.slots) {
        //     const el = slot.widget.render();
        //     slot.apply();
        //     document.body.appendChild(el);
        // }
        for (const slot of this.slots) {
          slot.apply();                       // apply erzeugt und stylt das Element
          const el = slot.widget.element;     // nimm das Element, das im Widget gespeichert ist
          document.body.appendChild(el);      // hänge genau dieses an
        }
    }

    update() {
        for (const slot of this.slots) slot.apply();
    }
}


// =====================
//   STANDARD WIDGETS
// =====================

export class TextBlock extends Widget {
    constructor(text="", color="white", fontSize=20) {
        super();
        this.text = text;
        this.color = color;
        this.fontSize = fontSize;
    }

    render() {
        const el = super.render();
        el.textContent = this.text;
        el.style.color = this.color;
        el.style.fontFamily = "sans-serif";
        el.dataset.baseFont = this.fontSize;
        return el;
    }
}

export class TextureBlock extends Widget {
    constructor(image, size=200, radius=10) {
        super();
        this.image = image;
        this.size = size;
        this.radius = radius;
    }

    render() {
        const el = super.render();
        el.style.backgroundImage = `url(${this.image})`;
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.style.width = this.size + "px";
        el.style.height = this.size + "px";
        el.style.borderRadius = this.radius + "px";
        el.dataset.baseSize = this.size;
        el.dataset.baseRadius = this.radius;
        return el;
    }
}

export class ButtonQuiet extends Widget {
    constructor(text="", paddingY=10, paddingX=20, border=1, radius=5) {
        super();
        this.text = text;
        this.basePaddingY = paddingY;
        this.basePaddingX = paddingX;
        this.baseBorder = border;
        this.baseRadius = radius;
        this.listeners = []; // Array für Click-Funktionen
    }

    render() {
        const el = super.render();
        el.textContent = this.text;
        el.style.background = "#ffffff22";
        el.style.border = "1px solid #ffffff55";
        el.style.cursor = "pointer";
        el.style.userSelect = "none";

        // Basiswerte für Scaling
        el.dataset.basePaddingY = this.basePaddingY;
        el.dataset.basePaddingX = this.basePaddingX;
        el.dataset.baseBorder = this.baseBorder;
        el.dataset.baseRadius = this.baseRadius;

        // Event Listener binden
        this.listeners.forEach(fn => el.addEventListener("click", fn));

        return el;
    }

    addListener(fn) {
        if (typeof fn === "function") this.listeners.push(fn);
    }
}