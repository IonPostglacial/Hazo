Vue.component("tree-menu", {
    props: ["name", "items", "buttons", "parent", "editable", "name-fields"],
    data() {
        return {
            menuFilter: ""
        };
    },
    methods: {
        shouldDisplayItem(item) {
            if (this.menuFilter !== "") {
                return !item.hidden && this.getItemName(item).toUpperCase().startsWith(this.menuFilter.toUpperCase());
            } else {
                return !item.hidden && (this.parent !== undefined || item.topLevel);
            }
        },
        getItemName(item) {
            const primaryNameField = !!this.nameFields ? this.nameFields[0] : "name";
            return item[primaryNameField];
        },
        getItemOtherNames(item) {
            return this.nameFields?.slice(1).map(field => item[field]).join(", ");
        },
        addItem(value, parentId) {
            this.$emit("add-item", { value, parentId });
        },
        deleteItem(parentId, id, itemId) {
            this.$emit("delete-item", { parentId, id, itemId });
        },
        buttonClicked(buttonId, parentId, id, itemId) {
            this.$emit("button-click", { buttonId, parentId, id, itemId });
        },
    },
    template: `
        <ul :class="'menu ' + (!parent ? 'medium-padding' : '')">
            <li v-if="!parent"><input type="search" v-model="menuFilter" placeholder="Filter" /></li>
            <li v-for="item, hierarchyId in items" v-if="shouldDisplayItem(item)">
                <div class="horizontal-flexbox center-items">
                    <label class="small-square blue-circle-hover thin-margin vertical-flexbox flex-centered" :for="name + '-open-' + item.id">
                        <div v-if="item.open" class="bottom-arrow">&nbsp</div>
                        <div v-if="!item.open" class="left-arrow">&nbsp;</div>
                    </label>
                    <input type="radio" class="invisible" :value="item.id" :id="name + '-' + item.id" :name="name" v-on:input="$emit('input', $event.target.value)" />
                    <label class="blue-hover flex-grow-1 medium-padding horizontal-flexbox center-items" :for="name + '-' + item.id">
                        <div :class="'flex-grow-1 ' + (item.warning ? 'warning-color' : '')">{{ getItemName(item) }}</div>
                        <slot></slot>
                        <div v-if="nameFields?.length > 1" class="medium-margin-horizontal">{{ getItemOtherNames(item) }}</div>
                    </label>
                    <button class="background-color-1" v-for="button in buttons" v-if="button.for === item.type" v-on:click="buttonClicked(button.id, item.parentId, item.id, item.id)">{{ button.label }}</button>
                    <div v-if="editable" class="close" v-on:click="deleteItem(item.parentId, item.id, item.id)"></div>
                </div>
                <div class="horizontal-flexbox start-aligned">
                    <div class="indentation-width"></div>
                    <div class="flex-grow-1">
                        <input type="checkbox" class="invisible" v-model="item.open" :id="name + '-open-' + item.id" />
                        <tree-menu v-if="item.open" :editable="editable" :name-fields="nameFields" :name="name" :items="item.children" :buttons="buttons" v-on="$listeners" :parent="hierarchyId">
                        </tree-menu>
                    </div>
                </div>
            </li>
            <li v-if="editable">
                <add-item v-on:add-item="addItem($event, parent)"></add-item>
            </li>
        </ul>
    `
});