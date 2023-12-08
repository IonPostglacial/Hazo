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
import { PropType } from "vue";
import { GeoMap, loadGeoJson } from "@/datatypes";


export default {
    name: "CharactersTree",
    props: {
        geoMap: Object as PropType<GeoMap>,
        selectedFeatures: Array,
    },
    data() {
        return {
            store: Hazo.store,
            geoJson: {} as any,
            maxHeight: 400,
            loading: false,
            displayedFile: undefined as string|undefined
        };
    },
    async mounted() {
        this.updateGraph();
    },
    watch: {
        geoMap() {
            this.updateGraph();
        },
        selectedFeatures() {
            this.updateFeatureSelection();
        }
    },
    methods: {
        updateFeatureSelection() {
            const property = this.geoMap?.property ?? "";
            const element = this.$refs["geo-viewer"] as Element;
            const el = d3.select(element);
            const features = this.selectedFeatures ?? [];
            el.selectAll("path").attr("fill", (d:any) => {
                return features.includes(d.properties[property]) ? "rgb(37, 113, 212)" : "white";
            });

        },
        updateD3() {
            const features = this.geoJson?.features;
            const property = this.geoMap?.property;
            console.log("update d3");
            if (typeof this.geoJson === "undefined" || !features) { return; }
            const element = this.$refs["geo-viewer"] as Element;
            const el = d3.select(element);
            el.selectAll("svg").remove();
            const svg = el.append("svg");
            svg.attr("width", "600px");
            svg.attr("height", "600px");
            const path = d3g.geoPath();
            const projection = d3g.geoMercator()
                .center(this.geoMap?.center ?? [0, 0])
                .scale(this.geoMap?.scale ?? 3000)
                .translate([200, 300]);
            path.projection(projection);
            const map = svg.selectAll("path")
                .data(features);
            map.enter()
                .append("path")
                .attr("fill", (d: any) => {
                    if (typeof property === "undefined" || typeof this.selectedFeatures === "undefined") { return "white"; }
                    return this.selectedFeatures.includes(d.properties[property]) ? "rgb(37, 113, 212)" : "white";
                })
                .attr("data-f", (d:any) => property? d.properties[property] : "")
                .attr("stroke","black")
                .attr("d", path as any)
                .append("svg:title")
                .attr("transform", function(d: any) { return "translate(" + path.centroid(d) + ")"; })
                .attr("dy", ".35em")
                .text((d: any) => property ? d.properties[property] : "");
            this.displayedFile = this.geoMap?.fileName;
        },
        updateGraph() {
            const mapName = this.geoMap?.fileName;
            if (!mapName || this.displayedFile === mapName) { return; }
            this.loading = true;
            setTimeout(async () => {
                try {
                    this.geoJson = await loadGeoJson(mapName)
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