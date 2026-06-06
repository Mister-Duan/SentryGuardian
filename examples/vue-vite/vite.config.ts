import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { mockHttpErrorsPlugin } from '../shared/vite-mock-api.js';

export default defineConfig({
  appType: 'spa',
  plugins: [vue(), mockHttpErrorsPlugin()],
  server: { port: 5175 },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
});
