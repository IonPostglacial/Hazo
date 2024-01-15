<template>
    <div class="scroll">
        <div v-if="loading" class="absolute medium-square">
            Loading...
        </div>
        <div ref="geo-viewer" :class="['geo-viewer', { blurred: loading }]">
        </div>
    </div>
</template>

<script lang="ts">
import * as d3 from "d3";
import * as d3g from "d3-geo";
import { PropType } from "vue";
import { GeoMap, loadGeoJson } from "@/datatypes";
import { getMapsCachedSvgDirectory, loadText, storeText } from "@/fs-storage";


export default {
    name: "GeoView",
    props: {
        geoMap: Object as PropType<GeoMap>,
        selectedFeatures: Array,
    },
    data() {
        return {
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
            const element = this.$refs["geo-viewer"] as Element;
            const paths = element.querySelectorAll("path");
            const features = this.selectedFeatures ?? [];
            paths.forEach(p => {
                p.setAttribute("fill", features.includes(p.dataset.f) ? "rgb(37, 113, 212)" : "white");
            });

        },
        updateD3() {
            const features = this.geoJson?.features;
            const property = this.geoMap?.property;
            if (typeof this.geoJson === "undefined" || !features) { return; }
            const element = this.$refs["geo-viewer"] as Element;
            const el = d3.select(element);
            el.selectAll("svg").remove();
            const svg = el.append("svg");
            svg.attr("viewBox", "0 0 600 600")
            svg.attr("preserveAspectRatio", "xMinYMin meet")
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
                .attr("data-f", (d:any) => property ? d.properties[property] : "")
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
                    const element = this.$refs["geo-viewer"] as Element;
                    const svgDir = await getMapsCachedSvgDirectory();
                    const svgText = await loadText(svgDir, mapName);
                    if (svgText === "") {
                        this.geoJson = await loadGeoJson(mapName)
                        this.updateD3();
                        const svgElement = element.querySelector("svg");
                        if (svgElement) {
                            storeText(svgDir, mapName, svgElement.outerHTML);
                        }
                    } else {
                        element.innerHTML = svgText;
                        this.updateFeatureSelection();
                    }
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