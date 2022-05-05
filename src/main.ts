import Vue from "vue";
import VueRouter from "vue-router";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";
import "@mdi/font/css/materialdesignicons.css";
import App from "./App.vue";
import { createStore } from "./store";
import TaxonPresentation from "./components/TaxonPresentation.vue";
import TaxonsTab from "./components/TaxonsTab.vue";
import TaxonMenu from "./components/TaxonMenu.vue";
import TaxonsStats from "./components/TaxonsStats.vue";
import CharactersTab from "./components/CharactersTab.vue";
import CharactersMenu from "./components/CharactersMenu.vue";
import CharactersTree from "./components/CharactersTree.vue";
import debounce from "./tools/debounce";
import VueGoogleMap from "vuejs-google-maps";
 // @ts-ignore
import VueSplit from 'vue-split-panel';
import "vuejs-google-maps/dist/vuejs-google-maps.css"

Vue.use(VueGoogleMap, {
    load: {
        apiKey: "AIzaSyClYri6lQql5nQkCwktcq2DJsjBDpmP_nU",
        libraries: [/* rest of libraries */]
    }
});

Vue.config.productionTip = false;

Vue.use(VueRouter);
Vue.use(Vuetify);
Vue.use(VueSplit);

declare global {
    namespace globalThis {
        namespace Hazo {
            export const store: ReturnType<typeof createStore>
        }
    }
}

globalThis.Hazo = {
    store: createStore()
};

const router = new VueRouter({
    routes: [
        { 
            path: "/",
            components: {
                default: TaxonsTab,
                LeftMenu: TaxonMenu,
            },
        },
        { path: "/taxons-stats", component: TaxonsStats },
        {
            path: "/taxons/:id?",
            components: {
                default: TaxonsTab,
                LeftMenu: TaxonMenu,
            },
        },
        { path: "/print-taxons/:id?", component: TaxonPresentation },
        {
            path: "/characters/:id?", 
            components: {
                default: CharactersTab,
                LeftMenu: CharactersMenu,
            },
        },
        { path: "/characters-tree", component: CharactersTree, props: route => ({ charactersHierarchy: Hazo.store.charactersHierarchy }) },
    ]
});

new Vue({
    render: h => h(App),
    router: router,
    vuetify: new Vuetify({
        icons: {
            iconfont: 'mdiSvg',
        },
    }),
}).$mount("#app");

function adaptSize() {
    document.documentElement.style.setProperty("--viewport-height", `${0.01 * window.innerHeight}px`);
}

document.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.key == "z") {
        Hazo.store.undo();
    }
});

window.addEventListener("load", function (e) {
    adaptSize();
});
window.addEventListener("resize", debounce(200, function (e) {
    adaptSize();
}));
navigator.serviceWorker?.register("img-caching-service-worker.js", { scope: "./" });
