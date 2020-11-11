import Vue from "vue";
import Vuex from "vuex";
import App from "./App.vue";
import { createStore } from "./store";

import "./components";

Vue.config.productionTip = false;
Vue.config.ignoredElements = [ "add-item" ];

Vue.use(Vuex);

const store = createStore();

new Vue({
    render: h => h(App),
    store: store,
}).$mount("#app");

navigator.serviceWorker.register("img-caching-service-worker.js", { scope: "./" });