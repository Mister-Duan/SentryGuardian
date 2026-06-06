import * as Sentry from '@sentry-guardian/browser';
import { resolveExampleDsn } from '../shared/example-dsn.js';

const dsn = resolveExampleDsn(import.meta.env.VITE_DSN);
const status = document.getElementById('csp-status');

if (!import.meta.env.VITE_DSN) {
  status.textContent = '未设置 VITE_DSN，已使用本地 seed 回退 DSN。';
}

Sentry.init({ dsn, environment: 'development', release: 'vanilla-csp-lab@0.1.0' });

async function triggerAndFlush(run) {
  run();
  await Sentry.flush(2000);
}

document.getElementById('csp-external-img')?.addEventListener('click', () => {
  void triggerAndFlush(() => {
    const img = document.createElement('img');
    img.alt = 'csp demo';
    img.src = 'https://example.com/blocked-by-csp.png';
    img.style.display = 'none';
    document.body.appendChild(img);
  });
});

document.getElementById('csp-external-script')?.addEventListener('click', () => {
  void triggerAndFlush(() => {
    const script = document.createElement('script');
    script.src = 'https://example.com/blocked-by-csp.js';
    document.head.appendChild(script);
  });
});

document.getElementById('csp-eval')?.addEventListener('click', () => {
  void triggerAndFlush(() => {
    // eslint-disable-next-line no-eval
    eval('void 0');
  });
});
