import * as Sentry from '@sentry-guardian/browser';
import { buildErrorDemoGroups } from '../shared/error-demos.js';
import { resolveExampleDsn } from '../shared/example-dsn.js';

const dsn = resolveExampleDsn(import.meta.env.VITE_DSN);

const statusEl = document.getElementById('sdk-status');
const root = document.getElementById('demo-root');

if (dsn) {
  Sentry.init({
    dsn,
    environment: 'development',
    release: 'vanilla-example@0.1.0',
  });
  if (import.meta.env.VITE_DSN) {
    statusEl.textContent = `SDK 已初始化 · release vanilla-example@0.1.0 · DSN ${maskDsn(dsn)}`;
    statusEl.className = 'status status--ok';
  } else {
    statusEl.textContent = `未设置 VITE_DSN，已使用 seed 回退 · DSN ${maskDsn(dsn)}`;
    statusEl.className = 'status status--warn';
  }
  renderDemos(Sentry);
} else {
  statusEl.textContent = '未配置 VITE_DSN，SDK 未初始化。';
  statusEl.className = 'status status--warn';
}

/**
 * Render demo button groups.
 * 渲染演示按钮分组。
 *
 * @param {typeof Sentry} sdk
 */
function renderDemos(sdk) {
  if (!root) return;

  for (const group of buildErrorDemoGroups(sdk)) {
    const section = document.createElement('section');
    section.innerHTML = `
      <h2>${group.title}</h2>
      ${group.description ? `<p class="section-desc">${group.description}</p>` : ''}
      <div class="grid"></div>
    `;
    const grid = section.querySelector('.grid');
    for (const demo of group.items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'demo-btn';
      btn.innerHTML = `
        <strong>${demo.label}</strong>
        <span>${demo.description}</span>
        <code>${demo.mechanism}</code>
      `;
      btn.addEventListener('click', () => {
        void runDemo(demo);
      });
      grid?.appendChild(btn);
    }
    root.appendChild(section);
  }
}

/**
 * @param {import('../shared/error-demos.js').ErrorDemo} demo
 */
function runDemo(demo) {
  window.setTimeout(async () => {
    try {
      await demo.run();
    } catch (err) {
      console.warn('[demo] caught', demo.id, err);
    }
    await Sentry.flush(2000);
  }, 0);
}

/**
 * @param {string} value
 */
function maskDsn(value) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/');
    const id = parts[parts.length - 1] ?? '';
    return `${url.origin}/…/${id.slice(0, 8)}…`;
  } catch {
    return '（无效 DSN）';
  }
}
