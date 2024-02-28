<template>
    <div class="flex-grow-1 scroll">
        <VBox>
            <HBox>
                <DropDownButton label="Characters">
                    <TreeMenu :items="ds.charactersHierarchy" 
                        :name-fields="taxonNameFields"
                        @select-item="addCharacter">
                    </TreeMenu>
                </DropDownButton>
                <DropDownButton label="Taxa">
                    <TreeMenu :items="ds.taxonsHierarchy" 
                        :name-fields="characterNameFields"
                        @select-item="addTaxon">
                    </TreeMenu>
                </DropDownButton>
                <Spacer></Spacer>
                <button type="button" @click="exportComparison">Export</button>
            </HBox>
            <table class="white-background medium-padding thin-border rounded">
                <thead class="thin-border">
                    <tr>
                        <th>Name</th>
                        <template v-for="char in selectedCharacters">
                            <th v-if="char.characterType === 'range'">
                                <HBox class="center-items gap-1">
                                    <button @click="removeCharacter(char)">
                                        <font-awesome-icon icon="fa-solid fa-close" />
                                    </button>
                                    <div>{{ char.name.S }} Min</div>
                                </HBox>
                            </th>
                            <th v-if="char.characterType === 'range'">
                                <div>{{ char.name.S }} Max</div>
                            </th>
                            <th v-if="char.characterType === 'discrete'">
                                <HBox class="center-items gap-1">
                                    <button @click="removeCharacter(char)">
                                        <font-awesome-icon icon="fa-solid fa-close" />
                                    </button>
                                    <div>{{ char.name.S }}</div>
                                </HBox>
                            </th>
                        </template>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="taxon in selectedTaxa">
                        <td>
                            <HBox class="center-items gap-1">
                                <button  @click="removeTaxon(taxon)">
                                    <font-awesome-icon icon="fa-solid fa-close" />
                                </button>
                                <div>{{ taxon.name.S }}</div>
                            </HBox>
                        </td>
                        <template v-for="char in selectedCharacters">
                            <td v-if="char.characterType === 'discrete'">
                            {{ 
                                taxon.states
                                    .filter(state => char.states?.some(s => s.id === state.id))
                                    .map(s => s.name.S)
                                    .join(", ")
                            }}
                            </td>
                            <template v-if="char.characterType === 'range'">
                                <td class="right-text">
                                    {{ taxon.measurements[char.id]?.min ?? "NA" }}
                                    {{ char.unit?.name.S }}
                                </td>
                                <td class="right-text">
                                    {{ taxon.measurements[char.id]?.max ?? "NA" }}
                                    {{ char.unit?.name.S }}
                                </td>
                            </template>
                        </template>
                    </tr>
                </tbody>
            </table>
        </VBox>
    </div>
</template>

<script lang="ts" setup>
    import { Language } from "@/db-index";
    import DropDownButton from "./toolkit/DropDownButton.vue";
    import TreeMenu from "./toolkit/TreeMenu.vue";
    import HBox from "./toolkit/HBox.vue";
    import VBox from "./toolkit/VBox.vue";
    import { useDatasetStore } from "@/stores/dataset";
    import { ref } from "vue";
    import { Character, Taxon } from "@/datatypes";
    import Spacer from "./toolkit/Spacer.vue";
    import download from "@/tools/download";
    import { escape } from "@/tools/parse-csv";

    const taxonNameFields: { label: string, propertyName: Language }[] = [{ label: 'NS', propertyName: 'S' }, { label: 'NV', propertyName: 'V'}, { label: '中文名', propertyName: 'CN' }];
    const characterNameFields: { label: string, propertyName: Language }[] = [{ label: 'FR', propertyName: 'S'}, { label: 'EN', propertyName: 'EN' }, { label: '中文名', propertyName: 'CN' }];
    const ds = useDatasetStore();
    const selectedCharacters = ref<Character[]>([]);
    const selectedTaxa = ref<Taxon[]>([]);

    function addCharacter(id: string) {
        const selectedChar = ds.characterWithId(id);
        if (selectedChar) {
            selectedCharacters.value.push(selectedChar);
        }
    }

    function removeCharacter(char: Character) {
        selectedCharacters.value = selectedCharacters.value.filter(ch => ch.id !== char.id);
    }

    function addTaxon(id: string) {
        const selectedTaxon = ds.taxonWithId(id);
        if (selectedTaxon) {
            selectedTaxa.value.push(selectedTaxon);
        }
    }

    function removeTaxon(taxon: Taxon) {
        selectedTaxa.value = selectedTaxa.value.filter(t => t.id !== taxon.id);
    }

    function exportComparison() {
        const csv: string[][] = [];
        const header = ["Name"];
        for (const char of selectedCharacters.value) {
            header.push(escape(char.name.S));
        }
        csv.push(header);
        for (const taxon of selectedTaxa.value) {
            const line = [taxon.name.S];
            for (const char of selectedCharacters.value) {
                line.push(escape(taxon.states
                            .filter(state => char.states?.some(s => s.id === state.id))
                            .map(s => s.name.S)
                            .join(", ")));
            }
            csv.push(line);
        }
        download(csv.map(line => line.join(",")).join("\n"), "csv");
    }
</script>