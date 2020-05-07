Vue.component("tree-menu", {
    props: ["name", "items", "parent", "editable"],
    methods: {
        addItem(value, parentId) {
            this.$emit("add-item", { value, parentId });
        },
        deleteItem(parentId, id, itemId) {
            this.$emit("delete-item", { parentId, id, itemId });
        },
    },
    template: `
        <ul class="menu">
            <li v-for="item, hierarchyId in items" v-if="!item.hidden && (parent !== undefined || item.topLevel)">
                <div class="horizontal-flexbox start-aligned">
                    <label class="small-square blue-circle-hover thin-margin vertical-flexbox flex-centered" v-if="Object.keys(item?.children ?? {}).length > 0" :for="name + '-open-' + item.entry.id">
                        <div v-if="item.open" class="bottom-arrow">&nbsp</div>
                        <div v-if="!item.open" class="left-arrow">&nbsp;</div>
                    </label>
                    <input type="radio" class="invisible" :value="item.entry.id" :id="name + '-' + item.entry.id" :name="name" v-on:input="$emit('input', $event.target.value)" />
                    <label class="blue-hover flex-grow-1 medium-padding" :for="name + '-' + item.entry.id">
                        <span :class="item.warning ? 'warning-color' : ''">{{ item.entry.name }}</span>
                        <slot></slot>
                    </label>
                    <div v-if="editable" class="close" v-on:click="deleteItem(item.parentId, item.id, item.entry.id)"></div>
                </div>
                <div v-if="Object.keys(item?.children ?? {}).length > 0" class="horizontal-flexbox start-aligned">
                    <div class="indentation-width"></div>
                    <div>
                        <input type="checkbox" class="invisible hide-next-unchecked" v-model="item.open" :id="name + '-open-' + item.entry.id" />
                        <tree-menu :editable="editable" :name="name" :items="item.children" v-on="$listeners" :parent="hierarchyId">
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