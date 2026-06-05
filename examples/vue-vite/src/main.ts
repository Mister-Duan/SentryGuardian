import { createApp } from 'vue';
import { init, vueIntegration } from '@sentry-guardian/vue';
import App from './App.vue';

const dsn = import.meta.env.VITE_DSN;
if (dsn) {
  init({ dsn, environment: 'development', release: 'vue-example@0.1.0' });
}

const app = createApp(App);
if (dsn) {
  vueIntegration(app);
}
app.mount('#app');
