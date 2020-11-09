<template>
    <div id="interactive-tree">
    </div>
</template>

<script lang="ts">
import type { Character, HierarchicalItem, Hierarchy } from "@/bunga"; // eslint-disable-line no-unused-vars
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import * as d3 from "d3";
import { State } from '@/bunga/datatypes'; // eslint-disable-line no-unused-vars

export default Vue.extend({
    name: "CharactersTree",
    props: {
        characters: Object as PropType<Hierarchy<Character>>,
    },
    mounted() {
        type D3Hierarchy = { name: string, children: D3Hierarchy[]|null, color?: string, _children?: D3Hierarchy };
        type D3HierarchyNode = d3.HierarchyNode<any> & { color?: string, _children?: any };
        function hierarchyToD3(hierarchy: Hierarchy<any>, h: any): D3Hierarchy {
            return { name: h.name, color: h.color, children: [...hierarchy.childrenOf(h), ...(h.states?.map((s: State) => ({ name: s.name, children: [], color: s.color })) ?? [])].map(child => hierarchyToD3(hierarchy, child)) };
        }
        const treeData: D3Hierarchy = { name: "Characters", children: [...this.characters!.topLevelItems].map(ch => hierarchyToD3(this.characters!, ch)) };
        const MAX_WIDTH = window.innerWidth, MAX_HEIGHT = this.$el.clientHeight;

        const margin = { top: 20, right: 90, bottom: 30, left: 90 },
            width = MAX_WIDTH - margin.left - margin.right,
            height = MAX_HEIGHT - margin.top - margin.bottom;

        // append the svg object to the body of the page
        // appends a "group" element to "svg"
        // moves the "group" element to the top left margin
        const svg = d3.select("#interactive-tree").append("svg")
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
            if(d.children) {
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
            const treeData = treemap(root);

            // Compute the new tree layout.
            const nodes = treeData.descendants(),
                links = treeData.descendants().slice(1);

            // Normalize for fixed-depth.
            nodes.forEach(function (d) { d.y = d.depth * 180});

            // ****************** Nodes section ***************************

            // Update the nodes...
            const node = svg.selectAll("g.node")
                .data(nodes, function(d) { return (d as any).id || ((d as any).id = ++i); });

            // Enter any new modes at the parent"s previous position.
            const nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", function() {
                    return "translate(" + source.y0 + "," + source.x0 + ")";
                })
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
            nodes.forEach(function(d: any){
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