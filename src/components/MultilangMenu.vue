<template>
  <v-card class="mx-auto" max-width="800">
    <v-sheet color="grey lighten-3" class="pa-1 d-flex flex-column">
      <v-row no-gutters class="mb-1">
          <v-text-field
            v-model="search"
            label="Search Items"
            dense
            small
            flat
            solo-inverted
            hide-details
            clearable
            clear-icon="mdi-close-circle-outline">
          </v-text-field>
          <v-spacer></v-spacer>
          <v-btn small icon @click="openAll"><v-icon>mdi-expand-all</v-icon></v-btn>
          <v-btn small icon @click="closeAll"><v-icon>mdi-collapse-all</v-icon></v-btn>
      </v-row>
      <v-row no-gutters>
        <v-btn-toggle v-model="selectedNamesIndices" color="primary" dense  multiple>
          <v-btn small v-for="nameField in nameFields" :key="nameField.propertyName">
            {{ nameField.label }}
          </v-btn>
        </v-btn-toggle>
        <v-spacer></v-spacer>
        <v-btn small icon color="success" @click.stop="openAddDialog(undefined)">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        <v-dialog v-model="addDialog" max-width="500">
          <v-card>
            <v-card-title class="text-h5"> New Item </v-card-title>

            <v-card-text>
              <v-text-field
                label="Item Name*"
                v-model="addDialogText"
                required
              ></v-text-field>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>

              <v-btn @click="addDialog = false"> Cancel </v-btn>

              <v-btn color="primary" @click="addItem"> Add the item </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-row>
    </v-sheet>
    <v-treeview
      ref="treeView"
      class="super-dense"
      dense
      activatable
      hoverable
      :open="open"
      :search="search"
      :items="treeItems"
      :active.sync="selectedItem"
    >
      <template v-slot:prepend="{ item }">
        {{ prettyId(item.id) }}
      </template>
      <template v-slot:append="{ item }">
        <v-btn icon small color="success" @click.stop="openAddDialog(item)">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        <v-btn icon small @click.stop="moveItemUp(item)">
          <v-icon>mdi-arrow-up</v-icon>
        </v-btn>
        <v-btn icon small @click.stop="moveItemDown(item)">
          <v-icon>mdi-arrow-down</v-icon>
        </v-btn>
        <v-btn icon small @click.stop="deleteItem(item)">
          <v-icon>mdi-trash-can-outline</v-icon>
        </v-btn>
      </template>
    </v-treeview>
  </v-card>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import { HierarchicalItem, Hierarchy } from "@/datatypes"; // eslint-disable-line no-unused-vars

type Tree = { id: string; name: string; children: Tree[] };
type NameLang = { label: string; propertyName: string };

function hierarchyToTree(h: Hierarchy<any>, selectedNames: NameLang[]): Tree {
  return h.children.map((c: Hierarchy<any>) => {
    const names = Object.assign({}, c.name);
    delete names["S"];
    return {
      id: c.id,
      get name() {
        return selectedNames
          .map((n) => names[n.propertyName] || c.name.S)
          .join(" ");
      },
      children: hierarchyToTree(c, selectedNames),
      names,
    };
  });
}

const knownPrefixes = ["t", "myt-", "c", "s", "d", "myd-"];

export default Vue.extend({
  name: "MultilangMenu",
  props: {
    baseUrl: String,
    items: Object as PropType<Hierarchy<HierarchicalItem>>,
    nameFields: Array as PropType<NameLang[]>,
  },
  data() {
    return {
      addDialog: false,
      addDialogParent: undefined as HierarchicalItem | undefined,
      addDialogText: "",
      open: [] as string[],
      selectedNamesIndices: this.nameFields.map((_, i) => i),
      search: "",
      selectedItem: new Array<string>(),
    };
  },
  computed: {
    treeItems(): Tree {
      return hierarchyToTree(this.items, this.selectedNames);
    },
    selectedNames(): NameLang[] {
      return this.selectedNamesIndices.map((i) => this.nameFields[i]);
    },
  },
  watch: {
    selectedItem(value: string[]) {
      if (value.length > 0) {
        this.$router.push({ path: `/${this.baseUrl}/${value[0]}` });
      }
    },
  },
  methods: {
    openAll() {
      (this.$refs.treeView as any).updateAll(true);
    },
    closeAll() {
      (this.$refs.treeView as any).updateAll(false);
    },
    prettyId(id: string): string {
      for (const prefix of knownPrefixes) {
        if (id.startsWith(prefix)) {
          return id.substring(prefix.length);
        }
      }
      return id ?? "";
    },
    openAddDialog(e: HierarchicalItem | undefined) {
      this.addDialogParent = e;
      this.addDialog = true;
    },
    addItem() {
      this.addDialog = false;
      this.$emit("add-item", {
        parentId: this.addDialogParent?.id,
        value: [this.addDialogText],
      });
      this.addDialogParent = undefined;
      this.addDialogText = "";
    },
    moveItemUp(e: HierarchicalItem) {
      this.$emit("move-item-up", e);
    },
    moveItemDown(e: HierarchicalItem) {
      this.$emit("move-item-down", e);
    },
    deleteItem(e: HierarchicalItem) {
      this.$emit("delete-item", { itemId: e.id });
    },
  },
});
</script>

<style>
</style>