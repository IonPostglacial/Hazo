const template = document.createElement("template");
template.innerHTML = `<link rel="stylesheet" href="style.css" />
    <div class="vertical-flexbox">
        <div class="horizontal-flexbox">
            <b id="header-text" class="flex-grow-1 medium-margin"></b>
            <label id="open-button" class="small-square blue-circle-hover thin-margin vertical-flexbox flex-centered">
                <div id="open-button-arrow" class="bottom-arrow">&nbsp;</div>
            </label>
        </div>
        <div id="panel">
            <slot></slot>
        </div>
    </div>`;

export class CollapsiblePanel extends HTMLElement {
    #label = "";
    #open = true;
    #headerText: HTMLElement|null = null;

    static get observedAttributes() { return ["label"]; }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    get label() { return this.#label; }
    get open() { return this.#open; }

    set label(newLabel) {
        this.#label = newLabel;
        if (this.#headerText !== null) {
            this.#headerText.textContent = this.label;
        }
    }

    set open(isOpen) {
        this.#open = isOpen;
        this.shadowRoot!.getElementById("open-button-arrow")!.className = this.#open ? "bottom-arrow" : "left-arrow";
        this.shadowRoot!.getElementById("panel")!.hidden = !this.#open;
    }

    connectedCallback() {
        this.className = "thin-border medium-margin white-background vertical-flexbox flex-grow-1";
        
        this.shadowRoot!.appendChild(template.content.cloneNode(true));
        this.#headerText = this.shadowRoot?.getElementById("header-text") ?? null;
        
        this.label = this.getAttribute("label") ?? this.#label;
        this.shadowRoot!.getElementById("open-button")!.onclick = () => {
            this.open = !this.open;
        }
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === "label") {
            this.label = newValue;
        }
    }
}

customElements.define("collapsible-panel", CollapsiblePanel);