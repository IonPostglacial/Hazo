Vue.component("tree-menu", {
    props: ["name", "items", "parent", "onAdd"],
    methods: {
        addItem(parentId) {
            this.$emit("add-item", parentId);
        }
    },
    template: `
        <ul>
            <li v-for="item, hierarchyId in items" v-if="parent !== undefined || item.topLevel">
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
                    <tree-menu :name="name" :items="item.children" v-on="$listeners" :parent="hierarchyId">
                    </tree-menu>
                </div>
            </li>
            <li>
                <input type="text" :id="'new-' + name + '-' + parent" />
                <button v-on:click="addItem(parent)" class="background-color-1">
                    Add
                </button>
            </li>
        </ul>
    `
});