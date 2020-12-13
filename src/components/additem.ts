const template = document.createElement("template");
template.innerHTML = `<link rel="stylesheet" href="style.css" />
    <div class="horizontal-flexbox">
        <input type="text" id="single-line-input" class="flex-grow-1" placeholder="Add an item" />
        <textarea type="text" id="multi-line-input" class="flex-grow-1 input-text invisible" rows="1" placeholder="Add multiple items"></textarea>
        <button id="multiline-button" title="Activate multiline mode">¶</button>
        <button id="add-button" title="Add an item" class="background-color-1">Add</button>
    </div>`;

export class AddItem extends HTMLElement {
    #isMultiline = false;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    get isMultiline() {
        return this.#isMultiline;
    }

    set isMultiline(isMultiline: boolean) {
        this.#isMultiline = isMultiline;

        if (isMultiline) {
            this._getSingleLineInput().classList.add("invisible");
            this._getSingleLineInput().value = "";
            this._getMultiLineInput().classList.remove("invisible");
        } else {
            this._getSingleLineInput().classList.remove("invisible");
            this._getMultiLineInput().classList.add("invisible");
            this._getMultiLineInput().value = "";
        }
    }

    private _getSingleLineInput(): HTMLInputElement {
        return this.shadowRoot?.getElementById("single-line-input") as HTMLInputElement;
    }

    private _getMultiLineInput(): HTMLInputElement {
        return this.shadowRoot?.getElementById("multi-line-input") as HTMLInputElement;
    }

    connectedCallback() {
        this.shadowRoot!.appendChild(template.content.cloneNode(true));
        const multilineButton = this.shadowRoot?.getElementById("multiline-button")!;
        const addButton = this.shadowRoot?.getElementById("add-button")!;
        const singleLineInput = this._getSingleLineInput();
        const multiLineInput = this._getMultiLineInput();

        const addItem = (value: string[]) => {
            const e = new CustomEvent("add-item", { detail: value });
            this.dispatchEvent(e);
        };
        const addSingleItem = () => {
            addItem([singleLineInput.value]);
            singleLineInput.value = "";
        };
        const addMultipleItems = () => {
            const linesToAdd = multiLineInput.value.split("\n").map(name => name.trim());
            for (const line of linesToAdd) {
                const columnsToAdd = line.split("\t").map(c => c.trim());
                if (columnsToAdd.length > 0) {
                    addItem(columnsToAdd);
                }
            }
            multiLineInput.value = "";
            this.isMultiline = false;
        };
        addButton.onclick = () => {
            if (this.isMultiline) {
                addMultipleItems();
            } else {
                addSingleItem();
            }
        };
        multilineButton.onclick = () => {
            this.isMultiline = !this.isMultiline;
        };
        singleLineInput.onkeydown = (e) => {
            if (e.key === "Enter") {
                addSingleItem();
            }
        };
    }
}

customElements.define("add-item", AddItem);