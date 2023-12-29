import * as Vue from "vue";
import * as VueRouter from "vue-router";
import { createPinia } from "pinia";
import { useDatasetStore } from "./stores/dataset";
import App from "./App.vue";
import TaxonPresentation from "./components/TaxonPresentation.vue";
import TaxonsTab from "./components/TaxonsTab.vue";
import TaxonsStats from "./components/TaxonsStats.vue";
import CharactersTab from "./components/CharactersTab.vue";
import CharactersTree from "./components/CharactersTree.vue";
import debounce from "./tools/debounce";
// @ts-ignore
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faArrowUp, faArrowDown, faArrowLeft, faArrowRight, faChevronRight, faChevronUp, faChevronDown,
        faLanguage, faCaretDown, faCaretUp, faPlus, faMinus, faPrint,
        faMagnifyingGlass, faMagnifyingGlassPlus, faMagnifyingGlassMinus, faClose,
        faBold, faItalic, faUnderline,
        faCopy, faPaste, faDownload, faUpload, faFileLines } from "@fortawesome/free-solid-svg-icons";

library.add(faArrowUp, faArrowDown, faArrowLeft, faArrowRight, faChevronRight, faChevronUp, faChevronDown,
    faCaretDown, faCaretUp, faLanguage, faPlus, faMinus, faPrint, 
    faMagnifyingGlass, faMagnifyingGlassPlus, faMagnifyingGlassMinus, faClose,
    faBold, faItalic, faUnderline,
    faCopy, faPaste, faDownload, faUpload, faFileLines);

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes: [
        { path: "/", component: TaxonsTab },
        { path: "/taxons-stats", component: TaxonsStats },
        { path: "/taxons/:id?", component: TaxonsTab },
        { path: "/print-taxons/:id?", component: TaxonPresentation },
        { path: "/characters/:id?", component: CharactersTab },
        { 
            path: "/characters-tree", 
            component: CharactersTree, props: _ => {
                const store = useDatasetStore();
                return { 
                    charactersHierarchy: store.charactersHierarchy
                };
            },
        },
    ],
});

const pinia = createPinia();
pinia.use(({ store }) => { store.router = Vue.markRaw(router) });
const app = Vue.createApp(App);
app.use(pinia);
app.use(router);
app.component("font-awesome-icon", FontAwesomeIcon);
app.mount("#app");

function adaptSize() {
    document.documentElement.style.setProperty("--viewport-height", `${0.01 * window.innerHeight}px`);
}

window.addEventListener("load", function () {
    adaptSize();
});
window.addEventListener("resize", debounce(200, function () {
    adaptSize();
}));
navigator.serviceWorker?.register("img-caching-service-worker.js", { scope: "./" });
