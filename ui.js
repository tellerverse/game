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

    setVisibility(visible) {
        const el = this.element;
        el.style.display = visible ? "block" : "none";
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
        const a = { x: el.dataset.alignX !== undefined ? parseFloat(el.dataset.alignX) : 0.5, y: el.dataset.alignY !== undefined ? parseFloat(el.dataset.alignY) : 0.5 };
        el.style.transform = `translate(-${(a.x * 100)}%, -${(a.y * 100)}%)`;
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
        for (const slot of this.slots) {
          slot.apply();
          const el = slot.widget.element;
          document.body.appendChild(el);
        }
    }

    update() {
        for (const slot of this.slots) slot.apply();
    }

    setVisibility(visible) {
        for (const slot of this.slots) {
            slot.widget.setVisibility(visible);
        }
    }
}


// =====================
//   STANDARD WIDGETS
// =====================

export class TextBlock extends Widget {
    constructor(text="", color="white", fontSize=20, align="left", alignment={ x: 0.5, y: 0.5 }) {
        super();
        this.text = text;
        this.color = color;
        this.fontSize = fontSize;
        this.align = align;
        this.alignment = alignment;
    }

    render() {
        const el = super.render();
        el.textContent = this.text;
        el.style.color = this.color;
        el.dataset.baseFont = this.fontSize;
        el.style.textAlign = this.align;
        el.dataset.alignX = this.alignment.x;
        el.dataset.alignY = this.alignment.y;
        return el;
    }

    setText(newText) {
        this.text = newText;
        if (this.element) this.element.textContent = newText;
    }
}

export class TextureBlock extends Widget {
    constructor(image, size=200, radius=10) {
        super();
        this.image = image;
        this.size = size;
        this.radius = radius;
    }

    // render() {
    //     const el = super.render();
    //     el.style.backgroundImage = `url(${this.image})`;
    //     el.style.backgroundSize = "cover";
    //     el.style.backgroundPosition = "center";
    //     el.style.width = this.size + "px";
    //     el.style.height = this.size + "px";
    //     el.style.borderRadius = this.radius + "px";
    //     el.dataset.baseSize = this.size;
    //     el.dataset.baseRadius = this.radius;
    //     return el;
    // }

    render() {
        const el = super.render();
        el.style.backgroundImage = `url(${this.image})`;
        el.style.backgroundSize = "contain"; 
        el.style.backgroundRepeat = "no-repeat";
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
    constructor(text="", paddingY=10, paddingX=20, border=1, radius=5, fontSize=40, color="#ffffff", transparent=true) {
        super();
        this.text = text;
        this.basePaddingY = paddingY;
        this.basePaddingX = paddingX;
        this.baseBorder = border;
        this.baseRadius = radius;
        this.baseFontSize = fontSize;
        this.baseColor = color;
        this.transparent = transparent;
        this.listeners = []; // Array für Click-Funktionen
    }

    setText(text) {
        this.text = text;
        if (this.element) this.element.textContent = text;
    }

    render() {
        const el = super.render();
        el.textContent = this.text;

        el.style.transition = "background 1.2s, border-color 1.2s, color 1.2s, opacity 0.5s";
        el.style.background = `${this.baseColor}${this.transparent ? "44" : "ff"}`;
        el.style.border = `1px solid ${this.baseColor}${this.transparent ? "44" : "ff"}`;
        el.style.cursor = "pointer";
        el.style.userSelect = "none";

        // Basiswerte für Scaling
        el.dataset.baseFont = this.baseFontSize;
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

    disable() {
        if (this.element) {
            this.element.style.pointerEvents = "none";
            this.element.style.opacity = "0.5";
            this.element.style.cursor = "default";
        }
    }
}