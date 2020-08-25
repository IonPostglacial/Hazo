export class CollapsiblePanel extends HTMLElement {
    label = "";
    open = true;

    static get observedAttributes() { return ["label"]; }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.label = this.getAttribute("label") ?? this.label;
    }

    connectedCallback() {
        this.className = "thin-border medium-margin white-background vertical-flexbox flex-grow-1";
        this.shadowRoot!.innerHTML = `
            <link rel="stylesheet" href="style.css">
            <div class="horizontal-flexbox">
            <b id="title-text" class="flex-grow-1 medium-margin">${this.label}</b>
            <label id="open-button" class="small-square blue-circle-hover thin-margin vertical-flexbox flex-centered">
                <div id="open-arrow" class="bottom-arrow">&nbsp;</div>
            </label>
            </div>
            <div id="panel">
                <slot></slot>
            </div>`;
        const openArrow = this.shadowRoot!.getElementById("open-arrow")!;
        const panel = this.shadowRoot!.getElementById("panel")!;
        this.shadowRoot!.getElementById("open-button")!.onclick = () => {
            this.open = !this.open;
            openArrow.className = this.open ? "bottom-arrow" : "left-arrow";
            panel.hidden = !this.open;
        }
    }

    updateRendering() {
        const titleText = this.shadowRoot!.getElementById("title-text");
        if (titleText !== null) {
            titleText.innerText = this.label;
        }
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === "label") {
            this.label = newValue;
            this.updateRendering();
        }
    }
}

customElements.define("collapsible-panel", CollapsiblePanel);