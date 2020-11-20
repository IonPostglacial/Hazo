import Vue from "vue";
import Vuex from "vuex";
import VueRouter from "vue-router";
import App from "./App.vue";
import { createStore } from "./store";
import TaxonsTab from "./components/TaxonsTab.vue";
import CharactersTab from "./components/CharactersTab.vue";
import CharactersTree from "./components/CharactersTree.vue";
import WordsDictionary from "./components/WordsDictionary.vue";
import "./components";


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
        { path: "/characters-tree", component: CharactersTree },
        { path: "/dictionary", component: WordsDictionary },
    ]
});

new Vue({
    render: h => h(App),
    store: store,
    router: router,
}).$mount("#app");

navigator.serviceWorker.register("img-caching-service-worker.js", { scope: "./" });