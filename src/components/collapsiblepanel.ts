import { $, _, txt } from "../htmlbuilder";

export class CollapsiblePanel extends HTMLElement {
    label = "";
    open = true;
    #html: ReturnType<typeof CollapsiblePanel.template>|null = null;

    static get observedAttributes() { return ["label"]; }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.label = this.getAttribute("label") ?? this.label;
    }

    static template(label: string) {
        return {
            style:  _("link", { rel: "stylesheet", href: "style.css" }, {}),
            header: _("div", { class: "horizontal-flexbox" }, {
                titleText: _("b", { class: "flex-grow-1 medium-margin" }, {
                    text: txt(label)
                }),
                openButton: _("label", {
                    class: "small-square blue-circle-hover thin-margin vertical-flexbox flex-centered"
                }, {
                    openArrow: _("div", { class: "bottom-arrow" }, { space: txt(" ") })
                })
            }),
            panel: _("div", {}, {
                slot: _("slot", {}, {})
            })
        };
    }

    connectedCallback() {
        this.className = "thin-border medium-margin white-background vertical-flexbox flex-grow-1";
        const root = this.#html = CollapsiblePanel.template(this.label);

        this.shadowRoot!.appendChild($(root.style));
        this.shadowRoot!.appendChild($(root.header));
        this.shadowRoot!.appendChild($(root.panel));

        $(root.header.openButton).onclick = () => {
            this.open = !this.open;
            $(root.header.openButton.openArrow).className = this.open ? "bottom-arrow" : "left-arrow";
            $(root.panel).hidden = !this.open;
        }
    }

    updateRendering() {
        if (this.#html !== null) {
            $(this.#html.header.titleText).textContent = this.label;
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