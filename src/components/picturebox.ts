import { AddItem } from "./additem";

const frameTemplate = document.createElement("template");
const frameTemplateEditable = document.createElement("template");
const boxTemplate = document.createElement("template");

const makeFrameTemplate = (innerHTML: string) => `<link rel="stylesheet" href="style.css" />
    <div class="vertical-flexbox space-between relative">
        ${innerHTML}
    </div>`;
frameTemplate.innerHTML = makeFrameTemplate(`
    <a id="open-photo" class="small-margin thin-border" href="#1">
        <img class="medium-max-width medium-max-height">
    </a>`);
frameTemplateEditable.innerHTML = makeFrameTemplate(`
    <div id="delete-photo" class="close absolute-top-right"></div>
    <a id="open-photo" class="small-margin thin-border" href="#1">
        <img class="medium-max-width medium-max-height">
    </a>
    <input id="set-photo" type="text" :value="photo" />`);
boxTemplate.innerHTML = `<link rel="stylesheet" href="style.css" />
    <collapsible-panel id="container" label="Pictures" class="centered-text thin-border medium-margin white-background wrap-flexbox">
        <slot></slot>
        <div class="vertical-flexbox space-between relative">
            <add-item id="add-photo"></add-item>
        </div>
    </collapsible-panel>`;

class PictureFrame extends HTMLElement {
    editable = false;
    #url = "";
    index = 0;

    static get observedAttributes() { return ["url", "index"]; }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    get url() { return this.#url; }

    private refreshUrl() {
        const image = this.shadowRoot?.querySelector("img");

        if (image instanceof HTMLImageElement) {
            image.src = this.#url ?? "";
        }
    }

    set url(newUrl) {
        this.#url = newUrl;
        this.refreshUrl();
    }

    connectedCallback() {
        this.editable = this.getAttribute("editable") === "true";
        this.#url = this.getAttribute("url") ?? "";
        this.index = parseInt(this.getAttribute("index") ?? "0");

        if (this.editable) {
            this.shadowRoot!.appendChild(frameTemplateEditable.content.cloneNode(true));
            this.shadowRoot!.getElementById("delete-photo")!.onclick = () => {
                const e = new CustomEvent("delete-photo", { bubbles: true, detail: { index: this.index } });
                this.dispatchEvent(e);
            }
            const setPhoto = this.shadowRoot!.getElementById("set-photo");
            if (setPhoto instanceof HTMLInputElement) {
                setPhoto.value = this.url;
                setPhoto.onchange = () => {
                    const e = new CustomEvent("set-photo", {
                        bubbles: true, 
                        detail: { value: setPhoto.value, index: this.index }
                    });
                    this.dispatchEvent(e);
                }
            }
        } else {
            this.shadowRoot!.appendChild(frameTemplate.content.cloneNode(true));
        }
        this.shadowRoot!.getElementById("open-photo")!.onclick = () => {
            const e = new CustomEvent("open-photo", { bubbles: true, detail: { index: this.index } });
            this.dispatchEvent(e);
        }
        this.refreshUrl();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        switch (name) {
        case "url":
            this.url = newValue;
            break;
        case "index":
            this.index = parseInt(newValue);
            break;
        }
    }
}

class PictureBox extends HTMLElement {
    editable = false;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.editable = this.getAttribute("editable") === "true";
        this.shadowRoot!.appendChild(boxTemplate.content.cloneNode(true));
        const addPhoto = this.shadowRoot!.getElementById("add-photo") as AddItem;
        if (this.editable) {
            addPhoto.addEventListener("add-item", (evt) => {
                const event = evt as Event & { detail: string };
                const e = new CustomEvent("add-photo", { detail: { value: event.detail }, bubbles: true });
                this.dispatchEvent(e);
            });
        } else {
            addPhoto.hidden = true;
        }
    }
}

customElements.define("picture-frame", PictureFrame);
customElements.define("picture-box", PictureBox);