import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Primevue from 'primevue/config';

import 'primevue/resources/themes/md-light-deeppurple/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css';

import "./assets/style.css"

const app = createApp(App)
app.use(Primevue)
app.use(store).use(router).mount('#app')
