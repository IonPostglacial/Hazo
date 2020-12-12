import { Picture } from '@/datatypes';
import { MutationTree } from 'vuex';
import { AddItem } from "./additem";

const frameTemplate = document.createElement("template");
const boxTemplate = document.createElement("template");

frameTemplate.innerHTML = `<link rel="stylesheet" href="style.css" />
    <div class="vertical-flexbox space-between relative">
        <div id="delete-photo" class="close white absolute-top-right"></div>
        <a id="open-photo" class="small-margin thin-border fill dark-background" href="#1">
            <img src="">
        </a>
        <div class="horizontal-flexbox">
            <input id="set-photo" type="text" class="no-fixed-width flex-grow-1" />
        </div>
    </div>`;
boxTemplate.innerHTML = `<link rel="stylesheet" href="style.css" />
    <collapsible-panel id="container" label="Pictures" class="centered-text thin-border medium-margin white-background wrap-flexbox">
        <slot></slot>
        <div class="horizontal-flexbox space-between relative">
            <div id="previous-next-btn-group" class="button-group invisible">
                <button type="button" id="previous-btn">&lt;</button>
                <button type="button" id="next-btn">&gt;</button>
            </div>
            <div id="txt-index" class="medium-padding"></div>
            <add-item id="add-photo" class="flex-grow-1"></add-item>
        </div>
    </collapsible-panel>`;

class PictureFrame extends HTMLElement {
    #editable = false;
    #picture: Picture|undefined = undefined;
    index = 0;

    static get observedAttributes() { return ["editable", "pictureid", "url", "label", "index"]; }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    get picture() { return this.#picture; }
    get editable() { return this.#editable; }

    private refreshEditable() {
        const deletePhoto = this.shadowRoot!.getElementById("delete-photo");
        const setPhoto = this.shadowRoot!.getElementById("set-photo");

        if (!deletePhoto || !setPhoto) return;
        
        if (this.editable) {
            deletePhoto.classList.remove("invisible");
            setPhoto.classList.remove("invisible");
        } else {
            deletePhoto.classList.add("invisible");
            setPhoto.classList.add("invisible");
        }
    }

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

    set editable(editable: boolean) {
        this.#editable = editable;
        this.refreshEditable();
    }

    connectedCallback() {
        this.index = parseInt(this.getAttribute("index") ?? "0");
        const id = this.getAttribute("pictureid") ?? "";
        const url = this.getAttribute("url") ?? "";
        const label = this.getAttribute("label") ?? "";
        this.#editable = !!this.getAttribute("editable");
        this.#picture = { id, url, label };

        this.shadowRoot!.appendChild(frameTemplate.content.cloneNode(true));
        
        this.shadowRoot!.getElementById("open-photo")!.onclick = () => {
            const e = new CustomEvent("open-photo", { bubbles: true, detail: { index: this.index } });
            this.dispatchEvent(e);
        }
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
        this.refreshEditable();
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
        case "editable":
            this.editable = !!newValue;
            break;
        }
        if (name !== "index") {
            this.picture = picture;
        }
    }
}

class PictureBox extends HTMLElement {
    #editable = false;
    #selectedPhotoIndex = 0;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    static get observedAttributes() { return ["editable"]; }

    get editable() { return this.#editable; }
    set editable(editable) {
        this.#editable = editable;
        this.refreshEditable();
    }

    get indexTextElement() {
        return this.shadowRoot!.getElementById("txt-index")!;
    }

    get previousNextButtonGroupElement() {
        return this.shadowRoot!.getElementById("previous-next-btn-group")!;
    }

    get indexText() {
        return this.children.length > 1 ? `${this.selectedPhotoIndex + 1} / ${this.children.length}` : "";
    }

    get selectedPhotoIndex() { return this.#selectedPhotoIndex; }
    set selectedPhotoIndex(index: number) {
        this.#selectedPhotoIndex = index;
        this.indexTextElement.innerHTML = this.indexText;
        Array.from(this.children).forEach((f, i) => {
            if (i === index) f.classList.remove("invisible"); else f.classList.add("invisible");
        });
    }

    refreshEditable() {
        const addPhoto = this.shadowRoot!.getElementById("add-photo") as AddItem|null;

        if (!addPhoto) return;

        if (this.editable) {
            addPhoto.classList.remove("invisible");
        } else {
            addPhoto.classList.add("invisible");
        }
    }

    refreshChildNumber() {
        if (this.children.length > 1) {
            this.previousNextButtonGroupElement.classList.remove("invisible");
        } else {
            this.previousNextButtonGroupElement.classList.add("invisible");
        }
    }

    connectedCallback() {
        this.#editable = !!this.getAttribute("editable");
        this.#selectedPhotoIndex = parseInt(this.getAttribute("photoindex") ?? "0");

        this.shadowRoot!.appendChild(boxTemplate.content.cloneNode(true));
        const addPhoto = this.shadowRoot?.getElementById("add-photo") as AddItem|null;
        const previousBtn = this.shadowRoot?.getElementById("previous-btn") as HTMLButtonElement|null;
        const nextBtn = this.shadowRoot?.getElementById("next-btn") as HTMLButtonElement|null;

        addPhoto?.addEventListener("add-item", (evt) => {
            const event = evt as Event & { detail: string };
            const e = new CustomEvent("add-photo", { detail: { value: event.detail }, bubbles: true });
            this.dispatchEvent(e);
        });
        previousBtn?.addEventListener("click", (evt) => {
            if (this.selectedPhotoIndex > 0) this.selectedPhotoIndex--;
        });
        nextBtn?.addEventListener("click", (evt) => {
            if (this.selectedPhotoIndex < this.children.length - 1) this.selectedPhotoIndex++;
        });
        this.refreshEditable();
        this.refreshChildNumber();
        this.indexTextElement.innerHTML = this.indexText;
        const self = this;
        const observer = new MutationObserver(function(mutationsList: MutationRecord[], observer: MutationObserver) {
            for(const mutation of mutationsList) {
                if (mutation.type === "childList") {
                    Array.from(mutation.addedNodes)
                        .filter(node => node.nodeName === "PICTURE-FRAME")
                        .forEach(() =>  {
                            self.selectedPhotoIndex = self.children.length - 1;
                            self.refreshChildNumber();
                        });
                    self.selectedPhotoIndex -= mutation.removedNodes.length;
                }
            }
        });
        observer.observe(this, { attributes: true, childList: true, subtree: true });
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        switch (name) {
        case "editable":
            this.editable = !!newValue;
            break;
        case "photoindex":
            this.selectedPhotoIndex = +newValue;
            break;
        }
    }
}

customElements.define("picture-frame", PictureFrame);
customElements.define("picture-box", PictureBox);