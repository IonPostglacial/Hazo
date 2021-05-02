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
    private _label = "";
    private _open = true;
    private _headerText: HTMLElement|null = null;

    static get observedAttributes() { return ["label"]; }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    get label() { return this._label; }
    get open() { return this._open; }

    set label(newLabel) {
        this._label = newLabel;
        if (this._headerText !== null) {
            this._headerText.textContent = this.label;
        }
    }

    set open(isOpen) {
        this._open = isOpen;
        this.shadowRoot!.getElementById("open-button-arrow")!.className = this._open ? "bottom-arrow" : "left-arrow";
        if (this._open) {
            this.shadowRoot!.getElementById("panel")?.classList.remove("invisible");
        } else {
            this.shadowRoot!.getElementById("panel")?.classList.add("invisible");
        }
    }

    connectedCallback() {
        this.className = "thin-border medium-margin white-background vertical-flexbox flex-grow-1";
        
        this.shadowRoot!.appendChild(template.content.cloneNode(true));
        this._headerText = this.shadowRoot?.getElementById("header-text") ?? null;
        
        this.label = this.getAttribute("label") ?? this._label;
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