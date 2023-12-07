<template>
    <div class="scroll">
        <div v-if="loading" class="absolute medium-square">
            Loading...
        </div>
        <div ref="geo-viewer" :class="{ blurred: loading }">
        </div>
    </div>
</template>

<script lang="ts">
import * as d3 from "d3";
import * as d3g from "d3-geo";


export default {
    name: "CharactersTree",
    props: {
        fileName: String,
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
            loading: false,
            displayedFile: undefined as string|undefined
        };
    },
    async mounted() {
        this.updateGraph();
    },
    watch: {
        geoJson() {
            this.updateGraph();
        }
    },
    methods: {
        updateD3() {
            if (typeof this.geoJson === "undefined" || !this.geoJson?.features) { return; }
            const element = this.$refs["geo-viewer"] as Element;
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
            this.displayedFile = this.fileName;
        },
        updateGraph() {
            if (this.displayedFile === this.fileName) { return; }
            this.loading = true;
            setTimeout(() => {
                try {
                    this.updateD3();
                } catch (e) {
                    console.error(e);
                } finally {
                    this.loading = false;
                }
            }, 0);
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
    }
};
</script>

<style>

</style>