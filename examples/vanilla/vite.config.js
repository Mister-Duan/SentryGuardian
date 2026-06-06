import { defineConfig } from 'vite';
import { mockHttpErrorsPlugin } from '../shared/vite-mock-api.js';

export default defineConfig({
  plugins: [mockHttpErrorsPlugin()],
  server: { port: 5174 },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        cspLab: 'csp-lab.html',
      },
    },
  },
});
