import { createApp, h } from "vue";
import { createRouter } from 'vue-router';
import App from "./App.vue";
import { createStore } from "./store";
import TaxonsTab from "./components/TaxonsTab.vue";
import CharactersTab from "./components/CharactersTab.vue";
import CharactersTree from "./components/CharactersTree.vue";
import WordsDictionary from "./components/WordsDictionary.vue";
import debounce from "./tools/debounce";
import VueGoogleMap from "vuejs-google-maps"
import "vuejs-google-maps/dist/vuejs-google-maps.css"

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

const router = createRouter({
    routes: [
        { path: "/", component: TaxonsTab },
        { path: "/taxons/:id?", component: TaxonsTab },
        { path: "/characters/:id?", component: CharactersTab },
        { path: "/characters-tree", component: CharactersTree, props: route => ({ charactersHierarchy: Hazo.store.charactersHierarchy }) },
        { path: "/dictionary", component: WordsDictionary },
    ]
});

const app = createApp({
    render() {
        return h(App);
    }
});
app.use(router);
app.use(VueGoogleMap, {
    load: {
        apiKey: "AIzaSyClYri6lQql5nQkCwktcq2DJsjBDpmP_nU",
        libraries: [/* rest of libraries */]
    }
});
app.mount("#app");

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
