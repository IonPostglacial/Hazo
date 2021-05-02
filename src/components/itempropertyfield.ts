const templateEditable = document.createElement("template");
const templateNonEditable = document.createElement("template");
const template = (inner: string) => `<link rel="stylesheet" href="style.css" />
    <div id="root" class="nowrap">
        <label class="item-property"><slot></slot></label>
        ${inner}
    </div>`;
templateEditable.innerHTML = template(`
    <input id="value-input" type="text" />
    <button id="button-push" title="Push the value to children">🡆</button>
`);
templateNonEditable.innerHTML = template(`
    <div id="value-text" class="inline-block medium-padding medium-margin" target="_blank"></div>
`);

export class ItemPropertyField extends HTMLElement {
    private _icon = "";
    private _editable = false;
    private _value = "";
    property = "";

    static get observedAttributes() { return ["icon", "editable", "property", "value"]; }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    get icon() { return this._icon; }
    get editable() { return this._editable; }
    get value() { return this._value; }

    private refreshIcon(root: Element) {
        let existingIcon = root!.querySelector("#icon") ?? null;
        if (this._icon === "" && existingIcon !== null) {
            root!.removeChild(existingIcon);
            return;
        }
        if (this._icon !== "" && existingIcon === null) {
            existingIcon = document.createElement("img");
            existingIcon.setAttribute("width", "18");
            existingIcon.setAttribute("height", "18");
            root!.querySelector("#root")!.prepend(existingIcon);
        }
        if (existingIcon) {
            existingIcon.setAttribute("src", "icons/" + this._icon);
        }
    }

    private refreshValue(root: Element) {
        if (this.editable) {
            const valueInput = root!.querySelector("#value-input");
            if (valueInput instanceof HTMLInputElement && valueInput.value !== this._value) {
                valueInput.value = this._value;
            }
        } else {
            const valueText = root!.querySelector("#value-text");
            if (valueText instanceof HTMLElement) {
                valueText.innerText = this._value;
            }
        }
    }

    private makeRootElement(): Element {
        let root: Element;
        if (this.editable) {
            root = templateEditable.content.cloneNode(true) as Element;

            const valueInput = root!.querySelector("#value-input") as HTMLInputElement;
            valueInput.onchange = () => {
                this.value = valueInput.value;        
                const e = new CustomEvent("set-property", { bubbles: true, detail: { property: this.property, value: this.value } });
                this.dispatchEvent(e);
            };
            const buttonPush = root!.querySelector("#button-push") as HTMLButtonElement;
            buttonPush.onclick = () => {
                const e = new CustomEvent("push-to-children", { bubbles: true, detail: this.property });
                this.dispatchEvent(e);
            };
        } else {
            root = templateNonEditable.content.cloneNode(true) as Element;
        }
        this.refreshIcon(root);
        this.refreshValue(root);
        return root;
    }

    private getRoot(): Element|null {
        return this.shadowRoot?.getElementById("root") ?? null;
    }

    set icon(iconUrl: string) {
        if (this._icon === iconUrl) return;

        this._icon = iconUrl;

        const root = this.getRoot();
        if (root) {
            this.refreshIcon(root);
        }
    }

    set value(newValue: string) {
        if (this._value === newValue) return;

        this._value = newValue;

        const root = this.getRoot();
        if (root) {
            this.refreshValue(root);
        }
    }

    set editable(isEditable) {
        this._editable = isEditable;

        this.shadowRoot!.innerHTML = "";
        this.shadowRoot!.appendChild(this.makeRootElement());
    }

    connectedCallback() {
        this.property =  this.getAttribute("property") ?? "";
        this.editable = this.getAttribute("editable") === "true";
        this.value    = this.getAttribute("value") ?? "";
        this.icon     = this.getAttribute("icon") ?? "";
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        switch (name) {
        case "icon":
            this.icon = newValue;
            break;
        case "editable":
            this.editable = (newValue === "true");
            break;
        case "property":
            this.property = newValue;
            break;
        case "value":
            this.value = newValue;
            break;
        }
    }
}

customElements.define("item-property-field", ItemPropertyField);