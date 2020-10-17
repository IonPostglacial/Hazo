import { Picture } from '@/bunga';
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
        <img class="medium-max-width medium-max-height" src="">
    </a>`);
frameTemplateEditable.innerHTML = makeFrameTemplate(`
    <div id="delete-photo" class="close absolute-top-right"></div>
    <a id="open-photo" class="small-margin thin-border" href="#1">
        <img class="medium-max-width medium-max-height" src="">
    </a>
    <input id="set-photo" type="text" class="no-fixed-width" />`);
boxTemplate.innerHTML = `<link rel="stylesheet" href="style.css" />
    <collapsible-panel id="container" label="Pictures" class="centered-text thin-border medium-margin white-background wrap-flexbox">
        <slot></slot>
        <div class="vertical-flexbox space-between relative">
            <add-item id="add-photo"></add-item>
        </div>
    </collapsible-panel>`;

class PictureFrame extends HTMLElement {
    editable = false;
    #picture: Picture|undefined = undefined;
    index = 0;

    static get observedAttributes() { return ["pictureid", "url", "label", "index"]; }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    get picture() { return this.#picture; }

    private refreshPicture() {
        const image = this.shadowRoot?.querySelector("img");

        if (typeof image !== "undefined" && image !== null) {
            image.src = this.picture?.url ?? "";
            image.alt = this.picture?.label ?? "";
        }
    }

    set picture(newPicture: Picture|undefined) {
        this.#picture = newPicture;
        this.refreshPicture();
    }

    connectedCallback() {
        this.editable = this.getAttribute("editable") === "true";
        this.index = parseInt(this.getAttribute("index") ?? "0");
        const id = this.getAttribute("pictureid") ?? "";
        const url = this.getAttribute("url") ?? "";
        const label = this.getAttribute("label") ?? "";
        this.#picture = { id, url, label };

        if (this.editable) {
            this.shadowRoot!.appendChild(frameTemplateEditable.content.cloneNode(true));
            this.shadowRoot!.getElementById("delete-photo")!.onclick = () => {
                const e = new CustomEvent("delete-photo", { bubbles: true, detail: { index: this.index } });
                this.dispatchEvent(e);
            }
            const setPhoto = this.shadowRoot!.getElementById("set-photo");
            if (setPhoto instanceof HTMLInputElement) {
                setPhoto.value = this.picture?.url ?? "";
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
        this.refreshPicture();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        const picture = {
            id: this.picture?.id ?? "",
            url: this.picture?.url ?? "",
            label: this.picture?.label ?? ""
        };
        switch (name) {
        case "pictureid":
            picture.id = newValue;
            break;
        case "url":
            picture.url = newValue;
            break;
        case "label":
            picture.label = newValue;
            break;
        case "index":
            this.index = parseInt(newValue);
            break;
        }
        if (name !== "index") {
            this.picture = picture;
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