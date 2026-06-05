# @sentry-guardian/vue

Vue 3 integration for the SentryGuardian browser SDK.

Vue 3 框架适配：在 `@sentry-guardian/browser` 之上挂接全局错误处理与 vue-router 面包屑。

## Install

```bash
pnpm add @sentry-guardian/vue @sentry-guardian/browser
```

Monorepo：`"@sentry-guardian/vue": "workspace:*"`

## Usage

Call `init` **before** `app.mount()`:

```ts
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import {
  init,
  vueIntegration,
  vueRouterIntegration,
} from '@sentry-guardian/vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: () => import('./App.vue') }],
});

init({
  dsn: import.meta.env.VITE_DSN,
  environment: import.meta.env.MODE,
  release: 'my-app@1.0.0',
  integrations: [vueRouterIntegration(router)],
});

const app = createApp(App);
vueIntegration(app);
app.use(router).mount('#app');
```

## API

| Export | Description |
|--------|-------------|
| `init` | Re-export from `@sentry-guardian/browser` |
| `getClient` | Re-export from `@sentry-guardian/browser` |
| `vueIntegration(app)` | Attach `app.config.errorHandler` → `captureException` |
| `vueRouterIntegration(router)` | Record route changes as breadcrumbs |

## Demo

See `examples/vue-vite` and [docs/learn/sdk-guide.md](../../docs/learn/sdk-guide.md).

## React

`packages/react` is intentionally not provided; use `@sentry-guardian/browser` in React apps.
