Vue.component("add-item", {
    props: ["onAdd"],
    methods: {
        addItem(e) {
            const input = e.target.tagName === "INPUT" ? e.target : e.target.previousElementSibling;
            const val = input.value;
            input.value = "";
            this.$emit("add-item", val);
        }
    },
    template: `
        <div class="horizontal-flexbox">
            <input class="flex-grow-1" type="text" v-on:keydown.enter="addItem" v-on:input="$emit('input', $event.target.value)" />
            <button class="background-color-1" v-on:click="addItem">
                Add
            </button>
        </div>
    `
});