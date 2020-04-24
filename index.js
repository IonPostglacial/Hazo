window.addEventListener("load", main);

function main() {
    const defaultData = {
        selectedItem: 0,
        selectedDescription: [],
        selectedTab: 0,
        tabs: [
            "Items",
            "Descriptors"
        ],
        items: {},
        itemsHierarchy: {},
        descriptions: []
    };
    const savedData = JSON.parse(localStorage.getItem("data")) ?? defaultData;
    Vue.component("tree-menu", {
        props: ["name", "items", "onAdd"],
        methods: {
            addItem() {
                this.$emit('add-item');
            }
        },
        template: `
            <ul>
                <li v-for="item, index in items">
                    <div class="horizontal-flexbox start-aligned">
                        <label class="small-square thin-margin vertical-flexbox flex-centered" v-if="Object.keys(item?.children ?? {}).length > 0" :for="name + '-open-' + index">
                            <div v-if="item.open" class="bottom-arrow">&nbsp</div>
                            <div v-if="!item.open" class="left-arrow">&nbsp;</div>
                        </label>
                        <input type="radio" class="invisible" :value="index" :id="name + '-' + index" :name="name" v-on:input="$emit('input', $event.target.value)" />
                        <label class="flex-grow-1 medium-padding" :for="name + '-' + index">
                            {{ item.entry.name }}
                            <slot></slot>
                        </label>
                    </div>
                    <input type="checkbox" class="invisible hide-next-unchecked" v-model="item.open" :id="name + '-open-' + index" />
                    <tree-menu v-if="Object.keys(item?.children ?? {}).length > 0"
                        :name="name"
                        :items="item.children"
                        v-on="$listeners">
                    </tree-menu>
                </li>
                <li>
                    <input type="text" :id="'new-' + name" />
                    <button v-on:click="addItem" class="background-color-1">
                        Add
                    </button>
                </li>
            </ul>
        `
    });

    var app = new Vue({
        el: '#app',
        data: savedData,
        methods: {
            addItem() {
                const newItemName = document.getElementById('new-item');
                const newItemId = "myt-" + Object.keys(this.items).length;
                Vue.set(this.items, newItemId, { name: newItemName.value, photo: '' });
                Vue.set(this.itemsHierarchy, newItemId, { entry: this.items[newItemId], children: {}, open: false });
                newItemName.value = '';
            },
            addDescription() {
                this.descriptions.push({
                    name: document.getElementById('new-description').value,
                    states: []
                });
            },
            addState(description, event) {
                description.states.push({
                    name: event.currentTarget.previousSibling.previousSibling.value
                });
            },
            selectDescription(selectionPath) {
                this.selectedDescription = selectionPath;
            },
            getDescription(descriptionPath, descriptions = null, cursor = 0) {
                const path = descriptionPath[cursor];

                if (descriptions === null) descriptions = this.descriptions;

                if (descriptionPath.length - cursor < 2) {
                    return descriptions[path];
                } else {
                    return this.getDescription(descriptionPath, descriptions[path].children, cursor + 1);
                }
            },
            saveData() {
                localStorage.setItem("data", JSON.stringify(this.$data));
            },
            resetData() {
                Vue.set(this.$data, "tabs", defaultData.tabs);
                Vue.set(this.$data, "items", defaultData.items);
                Vue.set(this.$data, "itemsHierarchy", defaultData.itemsHierarchy);
                Vue.set(this.$data, "descriptions", defaultData.descriptions);
            },
            importData() {
                const dataImport = document.getElementById("import-data");

                dataImport.click();
            },
            fileUpload(e) {
                const file = e.target.files[0];

                (async () => {
                    const { items, itemsHierarchy } = await SDD.load(file);
                    Vue.set(this.$data, "items", items);
                    Vue.set(this.$data, "itemsHierarchy", itemsHierarchy);
                })();
            },
            exportData() {

            }
        }
    });
}