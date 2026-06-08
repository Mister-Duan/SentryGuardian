import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { sentryGuardianVitePlugin } from '@sentry-guardian/vite-plugin';
import { mockHttpErrorsPlugin } from '../shared/vite-mock-api.js';
import { sdkWorkspaceAliases, sdkWorkspaceFsAllow } from '../shared/vite-sdk-alias.js';

const release = 'vue-example@0.1.0';

export default defineConfig({
  appType: 'spa',
  plugins: [
    vue(),
    mockHttpErrorsPlugin(),
    sentryGuardianVitePlugin({
      projectId: process.env.SG_PROJECT_ID ?? '',
      release,
      authToken: process.env.SG_TOKEN ?? '',
      monitorUrl: process.env.MONITOR_API_URL ?? 'http://localhost:3002',
      urlPrefix: process.env.SG_URL_PREFIX,
      dryRun: !process.env.SG_TOKEN || !process.env.SG_PROJECT_ID,
    }),
  ],
  resolve: {
    alias: sdkWorkspaceAliases({ vue: true }),
  },
  server: { port: 5175, fs: { allow: sdkWorkspaceFsAllow() } },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
});
