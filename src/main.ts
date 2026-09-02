import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import './assets/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);

// Wait for the first navigation (and its async auth guard) so the app never
// flashes the wrong screen before the session is known.
router.isReady().then(() => app.mount('#app'));
