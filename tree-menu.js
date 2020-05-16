Vue.component("tree-menu", {
    props: ["name", "items", "buttons", "parent", "editable", "name-field"],
    methods: {
        getItemName(item) {
            return item[this.nameField ?? "name"];
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
            <li v-for="item, hierarchyId in items" v-if="!item.hidden && (parent !== undefined || item.topLevel)">
                <div class="horizontal-flexbox start-aligned">
                    <label class="small-square blue-circle-hover thin-margin vertical-flexbox flex-centered" v-if="Object.keys(item?.children ?? {}).length > 0" :for="name + '-open-' + item.id">
                        <div v-if="item.open" class="bottom-arrow">&nbsp</div>
                        <div v-if="!item.open" class="left-arrow">&nbsp;</div>
                    </label>
                    <input type="radio" class="invisible" :value="item.id" :id="name + '-' + item.id" :name="name" v-on:input="$emit('input', $event.target.value)" />
                    <label class="blue-hover flex-grow-1 medium-padding" :for="name + '-' + item.id">
                        <span :class="item.warning ? 'warning-color' : ''">{{ getItemName(item) }}</span>
                        <slot></slot>
                    </label>
                    <button class="background-color-1" v-for="button in buttons" v-if="button.for === item.type" v-on:click="buttonClicked(button.id, item.parentId, item.id, item.id)">{{ button.label }}</button>
                    <div v-if="editable" class="close" v-on:click="deleteItem(item.parentId, item.id, item.id)"></div>
                </div>
                <div v-if="Object.keys(item?.children ?? {}).length > 0" class="horizontal-flexbox start-aligned">
                    <div class="indentation-width"></div>
                    <div class="flex-grow-1">
                        <input type="checkbox" class="invisible hide-next-unchecked" v-model="item.open" :id="name + '-open-' + item.id" />
                        <tree-menu :editable="editable" :name-field="nameField" :name="name" :items="item.children" :buttons="buttons" v-on="$listeners" :parent="hierarchyId">
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