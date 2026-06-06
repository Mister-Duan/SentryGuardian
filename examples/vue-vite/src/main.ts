import { createApp } from 'vue';
import * as Sentry from '@sentry-guardian/browser';
import { vueIntegration } from '@sentry-guardian/vue';
import { examplePerformanceIntegrations } from '../../shared/example-performance.js';
import App from './App.vue';

const dsn = import.meta.env.VITE_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: 'development',
    release: 'vue-example@0.1.0',
    integrations: examplePerformanceIntegrations(Sentry),
  });
}

const app = createApp(App);
if (dsn) {
  vueIntegration(app);
}
app.mount('#app');
