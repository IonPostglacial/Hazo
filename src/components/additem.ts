const template = document.createElement("template");
template.innerHTML = `<link rel="stylesheet" href="style.css" />
    <div class="horizontal-flexbox">
        <input type="text" class="flex-grow-1" />
        <button class="background-color-1">Add</button>
    </div>`;

export class AddItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.shadowRoot!.appendChild(template.content.cloneNode(true));
        const button = this.shadowRoot?.querySelector("button")!;
        const input = this.shadowRoot?.querySelector("input")!;

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