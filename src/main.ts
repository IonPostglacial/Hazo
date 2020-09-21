import Vue from "vue";
import App from "./App.vue";

import "./components";

Vue.config.productionTip = false;
Vue.config.ignoredElements = [ "add-item" ];

// register service worker
navigator.serviceWorker.register("img-caching-service-worker.js", { scope: "./" });
navigator.serviceWorker.ready
    .then(function () {
        console.log("service worker registered");
    })
    .catch(function (error) {
        console.log("error when registering service worker", error);
    });

new Vue({
    render: h => h(App),
}).$mount("#app");
