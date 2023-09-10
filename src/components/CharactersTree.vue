<template>
    <div :data-c="selectedCharacter ? selectedCharacter.id : ''">
        <div class="horizontal-flexbox no-print">
            <div class="horizontal-flexbox">
                <label for="lang-selector">Language</label>
                <select name="lang" id="lang-selector" v-model="lang">
                    <option v-for="(language, index) in languageList" :key="language.name" :value="index">{{ language.name }}</option>
                </select>
            </div>
            <button @click="exportMarkdown">Export to Markdown</button>
        </div>
        <div ref="interactive-tree">
        </div>
    </div>
</template>

<script lang="ts">
import type { Character, Dataset, Hierarchy } from "@/datatypes"; // eslint-disable-line no-unused-vars
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import * as d3 from "d3";
import download from "@/tools/download";

type D3Hierarchy = { name: string, url?: string, children: D3Hierarchy[]|null, color?: string, _children?: D3Hierarchy };
type D3HierarchyNode = d3.HierarchyNode<any> & { color?: string, _children?: any };

function updateD3(vue: Vue, element: Element, treeData: D3Hierarchy, fullHeight: boolean = false) {
    const clientHeight = document.body.clientHeight - 120;
    const MAX_WIDTH = window.innerWidth, MAX_HEIGHT = fullHeight ? clientHeight : Math.max(clientHeight, 400);

    const margin = { top: 20, right: 90, bottom: 30, left: 90 },
        width = MAX_WIDTH - margin.left - margin.right,
        height = MAX_HEIGHT - margin.top - margin.bottom;

    // append the svg object to the body of the page
    // appends a "group" element to "svg"
    // moves the "group" element to the top left margin
    d3.select(element).selectAll("svg").remove();
    const svg = d3.select(element).append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate("
            + margin.left + "," + margin.top + ")");
    let i = 0;
    const duration = 750,
        root: D3HierarchyNode & { x0?: number, y0?: number } = d3.hierarchy(treeData, function(d) { return d.children; }),
        treemap = d3.tree().size([height, width]);

    root.x0 = height / 2;
    root.y0 = 0;

    root.children?.forEach(collapse);

    update(root);

    function collapse(d: any) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function getColor(d: D3HierarchyNode): string {
        return d.data.color ? d.data.color : d._children ? "lightsteelblue" : "#fff";
    }

    function update(source: D3HierarchyNode & { x0?: number, y0?: number, x?: number, y?: number }) {
        // Assigns the x and y position for the nodes
        const tree = treemap(root);

        // Compute the new tree layout.
        const pointNodes = tree.descendants(),
            links = tree.descendants().slice(1);

        // Normalize for fixed-depth.
        pointNodes.forEach(function (d) { d.y = d.depth * 180});

        // ****************** Nodes section ***************************

        // Update the nodes...
        const node = svg.selectAll("g.node")
            .data(pointNodes, function(d) { return (d as any).id || ((d as any).id = ++i); });

        // Enter any new modes at the parent"s previous position.
        const nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function() {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on("dblclick", (e: any, d: any) => { if (d.data.url) vue.$router.push(d.data.url); })
            .on("click", click);

        // Add Circle for the nodes
        nodeEnter.append("circle")
            .attr("class", "node")
            .attr("r", 1e-6)
            .style("fill", function(d: D3HierarchyNode) {
                return getColor(d);
            });

        // Add labels for the nodes
        nodeEnter.append("text")
            .attr("dy", ".35em")
            .attr("x", function(d: D3HierarchyNode) {
                return d.children || d._children ? -13 : 13;
            })
            .attr("text-anchor", function(d: D3HierarchyNode) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d: d3.HierarchyPointNode<any>) { return d.data.name; });

        // UPDATE
        const nodeUpdate = nodeEnter.merge(node as any);

        // Transition to the proper position for the node
        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", function(d) { 
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Update the node attributes and style
        nodeUpdate.select("circle.node")
            .attr("r", 10)
            .style("fill", function(d: d3.HierarchyPointNode<any> & { _children?: number }) {
                return getColor(d);
            })
            .attr("cursor", "pointer");


        // Remove any exiting nodes
        const nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function() {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        // On exit reduce the node circles size to 0
        nodeExit.select("circle")
            .attr("r", 1e-6);

        // On exit reduce the opacity of text labels
        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // ****************** links section ***************************

        // Update the links...
        const link = svg.selectAll("path.link")
            .data(links, function(d: any) { return d.id; });

        // Enter any new links at the parent"s previous position.
        const linkEnter = link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function() {
                const o = { x: source.x0, y: source.y0 };
                return diagonal(o, o)
            });

        // UPDATE
        const linkUpdate = linkEnter.merge(link as any);

        // Transition back to the parent element position
        linkUpdate.transition()
            .duration(duration)
            .attr("d", function(d){ return diagonal(d, d.parent) });

        // Remove any exiting links
        link.exit().transition()
            .duration(duration)
            .attr("d", function() {
                const o = { x: source.x, y: source.y }
                return diagonal(o, o)
            })
            .remove();

        // Store the old positions for transition.
        pointNodes.forEach(function(d: any){
            d.x0 = d.x;
            d.y0 = d.y;
        });

        // Creates a curved (diagonal) path from parent to the child nodes
        function diagonal(s: any, d: any) {
            const path = `M ${s.y} ${s.x}
                    C ${(s.y + d.y) / 2} ${s.x},
                    ${(s.y + d.y) / 2} ${d.x},
                    ${d.y} ${d.x}`

            return path;
        }

        // Toggle children on click.
        function click(e: any, d: any) {
            if (d.children !== null) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update(d);
        }
    }
}

function hierarchyToMarkdown(data: D3Hierarchy, indentation=-1): string {
    let content = "";
    for (let i = 0; i < indentation; i++) content += "\t";
    if (indentation >= 0) content += `- ${data.name}\r\n`;
    for (const child of data.children ?? []) {
        content += hierarchyToMarkdown(child, indentation + 1);
    }
    return content;
}

export default Vue.extend({
    name: "CharactersTree",
    props: {
        selectedCharacter: Object as PropType<Character|undefined>,
    },
    data() {
        const langFR = { name: "FR", field: "S" }, langEN = { name: "EN", field: "EN" }, langCN = { name: "CN", field: "CN" };

        return {
            store: Hazo.store,
            languageList: [langFR, langEN, langCN],
            lang: 0,
        };
    },
    computed: {
        dataset(): Dataset {
            return this.store.dataset;
        },
        selectedLang(): { name: string, field: string } {
            return this.languageList[this.lang];
        },
        treeData(): D3Hierarchy {
            const hierarchyToD3 = (hierarchy: Hierarchy<Character>, item: any): D3Hierarchy => {
                const langFieldName = this.selectedLang.field;
                const charChildren: Character[] = item?.children ?? [];
                const inherentStateIds = charChildren.map(c => c.characterType === "discrete" ? c.inherentState?.id : undefined);
                return {
                    name: item.name ? item.name[langFieldName] : "",
                    url: (item.id ? ("characters/" + item.id) : undefined),
                    color: item.color,
                    children: [
                        ...charChildren.map(child => hierarchyToD3(hierarchy, child)),
                        ...this.dataset.characterStates(item)
                            .filter((s: any) => !inherentStateIds.includes(s.id))
                            .map((s: any) => ({ name: s.name[langFieldName], children: [], color: s.color }))
                    ]
                };
            };
            const hierarchy = this.store.dataset.charactersHierarchy;
            const topLevelItems = hierarchy.children;
            if (this.selectedCharacter) {
                return hierarchyToD3(hierarchy, this.selectedCharacter);
            } else {
                return { name: "Characters", children: topLevelItems.map(ch => hierarchyToD3(hierarchy, ch)) };
            }
        },
    },
    mounted() {
        updateD3(this, this.$refs["interactive-tree"] as Element, this.treeData, !this.selectedCharacter);
    },
    updated() {
        updateD3(this, this.$refs["interactive-tree"] as Element, this.treeData, !this.selectedCharacter);
    },
    methods: {
        exportMarkdown() {
            download(hierarchyToMarkdown(this.treeData), "md");
        }
    }
});
</script>

<style>

.node circle {
    fill: #fff;
    stroke: steelblue;
    stroke-width: 3px;
}

.node text {
    font: 12px sans-serif;
}

.link {
    fill: none;
    stroke: #ccc;
    stroke-width: 2px;
}

</style>