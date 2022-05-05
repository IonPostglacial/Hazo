<template>
    <MultilangMenu
        base-url="taxons"
        :items="taxonTree"
        :name-fields="nameFields"
        @move-item-up="moveUp" @move-item-down="moveDown"
        @add-item="addTaxon" @delete-item="removeTaxon"
    ></MultilangMenu>
</template>

<script lang="ts">
import Vue from "vue";
import MultilangMenu from "@/components/MultilangMenu.vue";
import { Book, Dataset, Taxon } from "@/datatypes";
import { transformHierarchy } from "@/datatypes/hierarchy";
import { createTaxon, taxonHasStates, taxonOrAnyChildHasStates } from "@/datatypes/Taxon";
import { createHierarchicalItem } from "@/datatypes/HierarchicalItem";


export default Vue.extend({
    components: { MultilangMenu },
    data() {
        return {
            nameFields: [{ label: 'NS', propertyName: 'S' }, { label: 'NV', propertyName: 'V'}, { label: '中文名', propertyName: 'CN' }],
            store: Hazo.store,
            selectedTaxonId: this.$route.params.id ?? "",
        }
    },
    watch: {
        $route(to: any) {
            this.selectedTaxonId = to.params.id;
        },
    },
    computed: {
        dataset(): Dataset {
            return this.store.dataset;
        },
        taxonTree(): Taxon {
            if (this.store.statesAllowList.length > 0 || this.store.statesDenyList.length > 0) {
                return transformHierarchy(this.dataset.taxonsHierarchy, {
                    map: t => t,
                    filter: t => taxonOrAnyChildHasStates(t, this.store.statesAllowList) && 
                        (this.store.statesDenyList.length == 0 || !taxonHasStates(t, this.store.statesDenyList)),
                });
            } else {
                return this.dataset.taxonsHierarchy;
            }
        },
    },
    methods: {
        moveUp(item: Taxon) {
            this.store.do("moveTaxonUp", item);
        },
        moveDown(item: Taxon) {
            this.store.do("moveTaxonDown", item);
        },
        addTaxon(e: {value: string[], parentId: string }) {
            console.log(e);
            const [name, vernacularName, nameCN] = e.value;
            this.store.do("addTaxon", createTaxon({
                ...createHierarchicalItem({ id: "", type: "", name: { S: name, V: vernacularName, CN: nameCN}, pictures: [], }),
                bookInfoByIds: Object.fromEntries(this.dataset.books!.map((book: Book) => [book.id, { fasc: "", page: undefined, detail: "" }])),
                parentId: e.parentId
            }));
        },
        removeTaxon(e: { itemId: string }) {
            const taxonToRemove = this.dataset.taxon(e.itemId);
            if (taxonToRemove) {
                this.store.do("removeTaxon", taxonToRemove);
            }
        },
    }
});
</script>