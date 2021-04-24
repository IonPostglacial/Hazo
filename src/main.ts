import Vue from "vue";
import Vuex from "vuex";
import VueRouter from "vue-router";
import App from "./App.vue";
import { createStore } from "./store";
import TaxonsTab from "./components/TaxonsTab.vue";
import CharactersTab from "./components/CharactersTab.vue";
import CharactersTree from "./components/CharactersTree.vue";
import WordsDictionary from "./components/WordsDictionary.vue";
import debounce from "./tools/debounce";
import "./components";
import VueGoogleMap from "vuejs-google-maps"
import "vuejs-google-maps/dist/vuejs-google-maps.css"

Vue.use(VueGoogleMap, {
    load: {
        apiKey: "AIzaSyClYri6lQql5nQkCwktcq2DJsjBDpmP_nU",
        libraries: [/* rest of libraries */]
    }
})


Vue.config.productionTip = false;
Vue.config.ignoredElements = ["add-item"];

Vue.use(Vuex);
Vue.use(VueRouter);

const store = createStore();
const router = new VueRouter({
    routes: [
        { path: "/", component: TaxonsTab },
        { path: "/taxons/:id?", component: TaxonsTab },
        { path: "/characters/:id?", component: CharactersTab },
        { path: "/characters-tree", component: CharactersTree, props: route => ({ charactersHierarchy: store.state.dataset.charactersHierarchy }) },
        { path: "/dictionary", component: WordsDictionary },
    ]
});

new Vue({
    render: h => h(App),
    store: store,
    router: router,
}).$mount("#app");

function adaptSize() {
    document.documentElement.style.setProperty("--viewport-height", `${0.01 * window.innerHeight}px`);
}

window.addEventListener("load", function (e) {
    adaptSize();
});
window.addEventListener("resize", debounce(200, function (e) {
    adaptSize();
}));
navigator.serviceWorker?.register("img-caching-service-worker.js", { scope: "./" });
