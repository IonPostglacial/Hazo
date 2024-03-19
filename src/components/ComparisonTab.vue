<template>
    <div class="flex-grow-1 scroll vertical-scroll">
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
                <MultiSelector :choices="langNames" v-model="langIds">
                </MultiSelector>
                <Spacer></Spacer>
                <button type="button" @click="exportComparison">Export</button>
            </HBox>
            <table class="white-background medium-padding thin-border rounded">
                <thead class="thin-border">
                    <tr>
                        <th v-for="col in table.header">
                            <HBox class="center-items gap-1">
                                <button v-if="col.type === 'measure' || col.type === 'state'" 
                                        @click="removeCharacter(col.character)">
                                    <font-awesome-icon icon="fa-solid fa-close" />
                                </button>
                                <div>{{ col.label }}</div>
                            </HBox>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row of table.data">
                        <td v-for="cell of row.cells">
                            <HBox v-if="cell.type === 'name'" class="center-items gap-1">
                                <button  @click="removeTaxon(row.taxon)">
                                    <font-awesome-icon icon="fa-solid fa-close" />
                                </button>
                                <div>{{ cell.value }}</div>
                            </HBox>
                            <template v-if="cell.type === 'measure'">
                                {{ cell.value ?? "NA" }}
                                {{ cell.unit?.name.S }}
                            </template>
                            <template v-if="cell.type === 'state'">
                                {{ cell.states.map(s => s.label).join(", ") }}
                            </template>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-for="measurements in measurementComparisons" class="white-background rounded relative medium-padding medium-margin">
                <h2>{{ measurements.char.name.S }}</h2>
                <div class="measurement-comparison-grid medium-margin">
                    <template v-for="m in measurements.measurements">
                        <div class="medium-padding">{{ m.label }}</div>
                        <div class="measurement-comparison-container">
                            <div class="inline-flexbox measurement-comparison-line measurement-min medium-padding right-text" :style="'width:' + (100*m.min/measurements.max) + '%'">
                                <Spacer></Spacer><div>{{ m.min }}m</div>
                            </div>
                            <div class="inline-flexbox measurement-comparison-line measurement-max medium-padding right-text" :style="'width:' + (100*(m.max-m.min)/measurements.max) + '%'">
                                <Spacer></Spacer><div>{{ m.max }}m</div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </VBox>
    </div>
</template>

<style scoped>
    .measurement-comparison-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1ch;
    }

    .measurement-comparison-container {
        border: 1px solid black;
        background-color: #e3dfdf;
    }

    .measurement-comparison-line {
        border-right: 1px solid black;
        color: white;
    }

    .measurement-min {
        background-color: #2571d4;
    }

    .measurement-max {
        background-color: #bd2237;
    }
</style>

<script lang="ts" setup>
    import { Language } from "@/db-index";
    import DropDownButton from "./toolkit/DropDownButton.vue";
    import TreeMenu from "./toolkit/TreeMenu.vue";
    import MultiSelector from "./toolkit/MultiSelector.vue";
    import HBox from "./toolkit/HBox.vue";
    import VBox from "./toolkit/VBox.vue";
    import { useDatasetStore } from "@/stores/dataset";
    import { ComputedRef, Ref, computed, ref } from "vue";
    import { Character, DiscreteCharacter, RangeCharacter, Taxon, Unit } from "@/datatypes";
    import Spacer from "./toolkit/Spacer.vue";
    import download from "@/tools/download";
    import { escape } from "@/tools/parse-csv";

    type AnyColumn = { label: string };
    type StateColumn = AnyColumn & { type: "state", character: DiscreteCharacter, lang: Language };
    type MeasureColumn = AnyColumn & { type: "measure", character: RangeCharacter, value: "min" | "max" };
    type NameColumn = AnyColumn & { type: "name" };
    type Column = StateColumn | MeasureColumn | NameColumn;
    type StateCell = { type: "state", column: StateColumn, states: { label: string }[] };
    type MeasureCell = { type: "measure", column: MeasureColumn, value: number|undefined, unit: Unit|undefined };
    type NameCell = { type: "name", column: NameColumn, value: string };
    type DataCell = StateCell | MeasureCell | NameCell;
    type Row = { taxon: Taxon, cells : DataCell[] };
    type Table = { header: Column[], data: Row[] };

    const taxonNameFields: { label: string, propertyName: Language }[] = [{ label: 'NS', propertyName: 'S' }, { label: 'NV', propertyName: 'V'}, { label: '中文名', propertyName: 'CN' }];
    const characterNameFields: { label: string, propertyName: Language }[] = [{ label: 'FR', propertyName: 'S'}, { label: 'EN', propertyName: 'EN' }, { label: '中文名', propertyName: 'CN' }];
    const ds = useDatasetStore();
    const selectedCharacters = ref<Character[]>([]);
    const selectedTaxa = ref<Taxon[]>([]);
    const langNames: Ref<Language[]> = ref(["FR", "CN", "EN"]);
    const langIds = ref([0]);
    const selectedLangs = computed(() => {
        return langIds.value.map(id => langNames.value[id]);
    });
    const table: ComputedRef<Table> = computed(() => {
        const nameColumn: NameColumn = { type: "name", label: "Name" };
        const table: Table = { header: [nameColumn], data: [] };
        for (const char of selectedCharacters.value) {
            if (char.characterType === "discrete") {
                for (const lang of selectedLangs.value) {
                    table.header.push({ type: "state", label: char.name[lang] ?? "", character: char, lang });
                }
            }
            if (char.characterType === "range") {
                table.header.push({ type: "measure", label: `${char.name.S} Min`, character: char, value: "min" });
                table.header.push({ type: "measure", label: "Max", character: char, value: "max" });
            }
        }
        for (const taxon of selectedTaxa.value) {
            const cells: DataCell[] = [{ type: "name", column: nameColumn, value: taxon.name.S }];
            for (const column of table.header) {
                if (column.type === "state") {
                    cells.push({ type: "state", column, states: taxon.states
                                .filter(state => column.character.states?.some(s => s.id === state.id))
                                .map(s => ({ label: s.name[column.lang] ?? "" })) });
                }
                if (column.type === "measure") {
                    const measurement = taxon.measurements[column.character.id];
                    const value = measurement ? measurement[column.value] : undefined;
                    cells.push({ type: "measure", column, value, unit: column.character.unit })
                }
            }
            table.data.push({ taxon, cells });
        }
        return table;
    });

    type MeasurementComparison = { char: RangeCharacter, max: number, measurements: { label: string, min: number, max: number }[] };

    const measurementComparisons: ComputedRef<MeasurementComparison[]> = computed(() => {
        const comp: MeasurementComparison[] = [];
        for (const char of selectedCharacters.value) {
            if (char.characterType === "range" && (char.unit?.name.S === "m" || char.unit?.base?.unit.name.S === "m")) {
                const measurements: { label: string, min: number, max: number }[] = [];
                let max = 0;
                for (const taxon of selectedTaxa.value) {
                    const m = taxon.measurements[char.id];
                    if (m) {
                        max = Math.max(max, m.max);
                        measurements.push({ label: taxon.name.S, min: m.min, max: m.max });
                    }
                }
                comp.push({ char, max, measurements });
            }
        }
        return comp;
    });

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
        csv.push(table.value.header.map(h => h.label));
        csv.push(...table.value.data.map(row => row.cells.map(c => {
            switch (c.type) {
                case "name":
                    return c.value;
                case "measure":
                    return `${c.value ?? ''} ${c.unit?.name.S ?? ''}`;
                case "state":
                    return c.states.map(s => s.label).join(", ");
            }
        })));
        download(csv.map(line => line.map(cell => escape(cell)).join(",")).join("\n"), "csv");
    }
</script>