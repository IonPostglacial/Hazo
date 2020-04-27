window.addEventListener("load", main);

function main() {
    const defaultData = {
        selectedItem: 0,
        selectedDescription: 0,
        selectedTab: 0,
        tabs: [
            "Items",
            "Descriptors"
        ],
        items: {},
        itemsHierarchy: {},
        descriptions: {},
        descriptionsHierarchy: {}
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
                <li v-for="item in items">
                    <div class="horizontal-flexbox start-aligned">
                        <label class="small-square blue-circle-hover thin-margin vertical-flexbox flex-centered" v-if="Object.keys(item?.children ?? {}).length > 0" :for="name + '-open-' + item.entry.id">
                            <div v-if="item.open" class="bottom-arrow">&nbsp</div>
                            <div v-if="!item.open" class="left-arrow">&nbsp;</div>
                        </label>
                        <input type="radio" class="invisible" :value="item.entry.id" :id="name + '-' + item.entry.id" :name="name" v-on:input="$emit('input', $event.target.value)" />
                        <label class="blue-hover flex-grow-1 medium-padding" :for="name + '-' + item.entry.id">
                            {{ item.entry.name }}
                            <slot></slot>
                        </label>
                    </div>
                    <div class="indented" v-if="Object.keys(item?.children ?? {}).length > 0">
                        <input type="checkbox" class="invisible hide-next-unchecked" v-model="item.open" :id="name + '-open-' + item.entry.id" />
                        <tree-menu :name="name" :items="item.children" v-on="$listeners">
                        </tree-menu>
                    </div>
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
                const newItemName = document.getElementById("new-item");
                const newItemId = "myt-" + Object.keys(this.items).length;
                Vue.set(this.items, newItemId, { name: newItemName.value, photo: "" });
                Vue.set(this.itemsHierarchy, newItemId, { entry: this.items[newItemId], children: {}, open: false });
                newItemName.value = "";
            },
            addDescription() {
                const newDescriptionName = document.getElementById("new-description");
                const newDescriptionId = "myd-" + Object.keys(this.descriptions).length;
                Vue.set(this.descriptions, newDescriptionId, {
                    name: newDescriptionName.value,
                    states: []
                });
                Vue.set(this.descriptionsHierarchy, newDescriptionId, {
                    entry: this.descriptions[newDescriptionId],
                    children: {},
                    open: false
                });
                newDescriptionName.value = "";
            },
            addState(description, event) {
                description.states.push({
                    name: event.currentTarget.previousSibling.previousSibling.value
                });
            },
            saveData() {
                localStorage.setItem("data", JSON.stringify(this.$data));
            },
            resetData() {
                Vue.set(this.$data, "tabs", defaultData.tabs);
                Vue.set(this.$data, "items", defaultData.items);
                Vue.set(this.$data, "itemsHierarchy", defaultData.itemsHierarchy);
                Vue.set(this.$data, "descriptions", defaultData.descriptions);
                Vue.set(this.$data, "descriptionsHierarchy", defaultData.descriptionsHierarchy);
            },
            importData() {
                const dataImport = document.getElementById("import-data");

                dataImport.click();
            },
            fileUpload(e) {
                const file = e.target.files[0];

                (async () => {
                    const { items, itemsHierarchy, descriptors, descriptorsHierarchy } = await SDD.load(file);
                    Vue.set(this.$data, "items", items);
                    Vue.set(this.$data, "itemsHierarchy", itemsHierarchy);
                    Vue.set(this.$data, "descriptions", descriptors);
                    Vue.set(this.$data, "descriptionsHierarchy", descriptorsHierarchy);
                })();
            },
            exportData() {

            }
        }
    });
}