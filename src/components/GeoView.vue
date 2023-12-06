<template>
    <div class="scroll">
        <div ref="geo-viewer">
        </div>
    </div>
</template>

<script lang="ts">
import * as d3 from "d3";
import * as d3g from "d3-geo";
import download from "@/tools/download";


export default {
    name: "CharactersTree",
    props: {
        geoJson: Object,
        property: String,
        centerLat: Number,
        centerLong: Number,
        scale: Number,
    },
    data() {
        return {
            store: Hazo.store,
            maxHeight: 400,
            data: {} as any,
        };
    },
    async mounted() {
        this.updateGraph();
    },
    updated() {
        this.updateGraph();
    },
    methods: {
        updateD3(element: Element, _data: any, _maxHeight: number) {
            if (typeof this.geoJson === "undefined" || !this.geoJson?.features) { return; }
            const el = d3.select(element);
            el.selectAll("svg").remove();
            const svg = el.append("svg");
            svg.attr("width", "600px");
            svg.attr("height", "600px");
            const path = d3g.geoPath();
            const projection = d3g.geoMercator()
                .center([this.centerLat ?? 0, this.centerLong ?? 0])
                .scale(this.scale ?? 3000)
                .translate([200, 300]);
            path.projection(projection);
            const map = svg.selectAll("path")
                .data(this.geoJson?.features);
            map.enter()
                .append("path")
                .attr("fill","white")
                .attr("stroke","black")
                .attr("d", path as any)
                .append("svg:title")
                .attr("class", function(d: any) { return "path " + d.id; })
                .attr("transform", function(d: any) { return "translate(" + path.centroid(d) + ")"; })
                .attr("dy", ".35em")
                .text((d: any) => this.property ? d.properties[this.property] : "");
        },
        updateGraph() {
            this.updateD3(this.$refs["geo-viewer"] as Element, this.data, this.computeMaxHeight(false));
        },
        computeMaxHeight(fullHeight: boolean) {
            return fullHeight ? Math.max(document.body.clientHeight - 120, this.maxHeight) : this.maxHeight;
        },
        magnify() {
            this.maxHeight += 300;
            this.updateGraph();
        },
        minify() {
            this.maxHeight -= 300;
            this.updateGraph();
        },
        downloadSvg() {
            const svg = (this.$refs["interactive-tree"] as Element).firstChild as SVGElement|null;
            if (svg === null) { console.error("cannot export interactive tree"); return; }
            const serializer = new XMLSerializer();
            svg.querySelectorAll(".node circle").forEach(e => {
                e.setAttribute("style", "fill:#fff;stroke:steelblue;stroke-width:3px;" + 
                    e.getAttribute("style"));
            });
            svg.querySelectorAll(".node text").forEach(e => {
                e.setAttribute("style", "font: 12px sans-serif;" + 
                    e.getAttribute("style"));
            });
            svg.querySelectorAll(".link").forEach(e => {
                e.setAttribute("style", "fill:none;stroke:#ccc;stroke-width:2px;" + 
                    e.getAttribute("style"))
            });
            let source = serializer.serializeToString(svg);
            download(source, "svg", "characters-tree");
        },
    }
};
</script>

<style>

</style>