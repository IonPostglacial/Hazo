import { CachablePicture } from '@/bunga/picture'

export class ItemPicture extends HTMLElement {
    #picture: CachablePicture|undefined = undefined;

    static get observedAttributes() { return ["pictureid", "url", "label"]; }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    get pictureid() { return this.picture?.id ?? ""; }
    get url() { return this.picture?.url ?? ""; }
    get label() { return this.picture?.label ?? ""; }

    private async refreshPicture() {
        if (typeof this.#picture === "undefined") return;

        let innerHTML = `<link rel="stylesheet" href="style.css" />`;
        const classes = this.getAttribute("img-class") ?? "";

        if (this.#picture.type === "bitmap") {
            const url = URL.createObjectURL(await this.#picture.getContent());
            innerHTML += `<img src="${url}" class="${classes}">`;
        } else {
            const content = await this.#picture.getContent();
            if (typeof content === "string") {
                innerHTML += `<div class="${classes}">${content}</div>`;
            }
        }
        this.shadowRoot!.innerHTML = innerHTML;
    }

    set picture(picture: CachablePicture|undefined) {
        if (picture?.url === this.#picture?.url) return;

        this.#picture = picture;
        this.refreshPicture();
    }

    connectedCallback() {
        const id = this.getAttribute("pictureid") ?? "";
        const url = this.getAttribute("url") ?? "";
        const label = this.getAttribute("label") ?? "";
        this.picture = new CachablePicture({ id, url, label });
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
        }
        this.picture = new CachablePicture(picture);
    }
}

customElements.define("item-picture", ItemPicture);