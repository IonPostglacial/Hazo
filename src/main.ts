import Vue from "vue";
import App from "./App.vue";

import "./components";

Vue.config.productionTip = false;
Vue.config.ignoredElements = [ "add-item" ];

new Vue({
    render: h => h(App),
}).$mount("#app");

navigator.serviceWorker.getRegistration("./")
    .then(registration => {
        if (typeof registration !== "undefined") {
            registration.unregister();
        }
    });