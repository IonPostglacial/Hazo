<template>
    <MultilangMenu
        base-url="characters"
        :items="charactersHierarchy"
        :name-fields="nameFields"
        @move-item-up="moveUp" @move-item-down="moveDown"
        @add-item="addCharacter" @delete-item="removeCharacter"
    ></MultilangMenu>
</template>

<script lang="ts">
import Vue from "vue";
import MultilangMenu from "@/components/MultilangMenu.vue";
import { Dataset } from "@/datatypes";
import { Hierarchy } from "@/datatypes/hierarchy";
import { Character } from "@/datatypes/types";
import { createCharacter } from "@/datatypes/Character";


export default Vue.extend({
    components: { MultilangMenu },
    data() {
        return {
            nameFields: [{ label: 'NS', propertyName: 'S' }, { label: 'NV', propertyName: 'V'}, { label: '中文名', propertyName: 'CN' }],
            store: Hazo.store,
            selectedCharacterId: this.$route.params.id ?? "",
        }
    },
    watch: {
        $route(to: any) {
            this.selectedCharacterId = to.params.id;
        },
    },
    computed: {
        dataset(): Dataset {
            return this.store.dataset;
        },
        charactersHierarchy(): Hierarchy<Character> {
            return this.store.dataset.charactersHierarchy;
        },
        selectedCharacter(): Character|undefined {
            return this.dataset.character(this.selectedCharacterId);
        },
    },
    methods: {
        moveUp(item: Character) {
            if (this.selectedCharacter) this.store.do("moveCharacterUp", item);
        },
        moveDown(item: Character) {
            if (this.selectedCharacter) this.store.do("moveCharacterDown", item);
        },
        addCharacter(e: { value: string[], parentId: string }) {
            const [name, nameCN] = e.value;
            this.store.do("addCharacter", createCharacter({
                presetStates: this.dataset.presetStates,
                name: { S: name, FR: name, CN: nameCN }, 
                parentId: e.parentId,
            }));
        },
        removeCharacter(e: { itemId: string}) {
            const characterToDelete = this.dataset.character(e.itemId);
            if (typeof characterToDelete !== "undefined") {
                this.store.do("removeCharacter", characterToDelete);
            } else {
                console.warn(`Trying to delete character with id ${e.itemId} which doesn't exist.`, this.charactersHierarchy);
            }
        },
    }
});
</script>