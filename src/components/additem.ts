export class AddItem extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
        this.shadowRoot!.innerHTML = `
            <link rel="stylesheet" href="style.css">
            <div class="horizontal-flexbox">
                <input class="flex-grow-1" type="text" v-model="text" />
                <button class="background-color-1" v-on:click="addItem">
                    Add
                </button>
            </div>`;
        const button = this.shadowRoot!.querySelector("button")!;
        const input = this.shadowRoot!.querySelector("input")!;

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