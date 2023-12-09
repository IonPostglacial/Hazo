import * as Vue from "vue";
import * as VueRouter from "vue-router";
import App from "./App.vue";
import { createStore } from "./store";
import TaxonPresentation from "./components/TaxonPresentation.vue";
import TaxonsTab from "./components/TaxonsTab.vue";
import TaxonsStats from "./components/TaxonsStats.vue";
import CharactersTab from "./components/CharactersTab.vue";
import CharactersTree from "./components/CharactersTree.vue";
import NamesDictionary from "./components/NamesDictionary.vue";
import debounce from "./tools/debounce";
// @ts-ignore
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faArrowUp, faArrowDown, faArrowLeft, faArrowRight,
        faLanguage, faCaretDown, faCaretUp, faPlus, faMinus, faPrint, 
        faMagnifyingGlass, faMagnifyingGlassPlus, faMagnifyingGlassMinus, faClose,
        faBold, faItalic, faUnderline,
        faCopy, faPaste, faUpload, faNotdef, faFileLines } from "@fortawesome/free-solid-svg-icons";

library.add(faArrowUp, faArrowDown, faArrowLeft, faArrowRight,
    faCaretDown, faCaretUp, faLanguage, faPlus, faMinus, faPrint, 
    faMagnifyingGlass, faMagnifyingGlassPlus, faMagnifyingGlassMinus, faClose,
    faBold, faItalic, faUnderline,
    faCopy, faPaste, faUpload, faNotdef, faFileLines);

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes: [
        { path: "/", component: TaxonsTab },
        { path: "/taxons-stats", component: TaxonsStats },
        { path: "/taxons/:id?", component: TaxonsTab },
        { path: "/print-taxons/:id?", component: TaxonPresentation },
        { path: "/characters/:id?", component: CharactersTab },
        { path: "/characters-tree", component: CharactersTree, props: _ => ({ charactersHierarchy: Hazo.store.charactersHierarchy }) },
        { path: "/dictionary", component: NamesDictionary },
    ]
});

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

const app = Vue.createApp(App);
app.use(router);
app.component("font-awesome-icon", FontAwesomeIcon);
app.mount("#app");

function adaptSize() {
    document.documentElement.style.setProperty("--viewport-height", `${0.01 * window.innerHeight}px`);
}

document.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.key == "z") {
        Hazo.store.undo();
    }
});

window.addEventListener("load", function () {
    adaptSize();
});
window.addEventListener("resize", debounce(200, function () {
    adaptSize();
}));
navigator.serviceWorker?.register("img-caching-service-worker.js", { scope: "./" });
