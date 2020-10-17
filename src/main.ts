import Vue from "vue";
import App from "./App.vue";

import "./components";

Vue.config.productionTip = false;
Vue.config.ignoredElements = [ "add-item" ];

new Vue({
    render: h => h(App),
}).$mount("#app");

navigator.serviceWorker.register("img-caching-service-worker.js", { scope: "./" });