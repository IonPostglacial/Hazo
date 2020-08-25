import { $, _, txt } from "../htmlbuilder";

export class AddItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        const root = {
            style: _("link", { rel: "stylesheet", href: "style.css" }, {}),
            hbox:  _("div", { class: "horizontal-flexbox" }, {
                textField: _("input", { type: "text", class: "flex-grow-1" }, {}),
                button:    _("button", { class: "background-color-1" }, {
                    text: txt("Add")
                })
            })
        };
        this.shadowRoot!.appendChild($(root.style));
        this.shadowRoot!.appendChild($(root.hbox));
        const button = $(root.hbox.button);
        const input = $(root.hbox.textField);

        const addItem = () => {
            const text = input.value;
            input.value = "";
            const e = new CustomEvent("add-item", { detail: text });
            this.dispatchEvent(e);
        };
        button.onclick = addItem;
        input.onkeydown = (e) => {
            if (e.key === "Enter") {
                addItem();
            }
        };
    }
}

customElements.define("add-item", AddItem);