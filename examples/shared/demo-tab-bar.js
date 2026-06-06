import { DEMO_TABS } from './demo-routes.js';

/**
 * Render tab bar for /error and /perf.
 * 渲染 /error 与 /perf 切换 Tab 栏。
 *
 * @param {HTMLElement} container
 * @param {'error' | 'perf'} activeId
 * @param {(tabId: 'error' | 'perf') => void} onSelect
 */
export function renderDemoTabBar(container, activeId, onSelect) {
  container.innerHTML = '';
  container.className = 'demo-tabs';
  container.setAttribute('role', 'tablist');
  container.setAttribute('aria-label', '演示分类');

  for (const tab of DEMO_TABS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `demo-tab${tab.id === activeId ? ' demo-tab--active' : ''}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', tab.id === activeId ? 'true' : 'false');
    btn.textContent = tab.label;
    btn.addEventListener('click', () => onSelect(tab.id));
    container.appendChild(btn);
  }
}

/**
 * Update tab hint text below the bar.
 * 更新 Tab 栏下方的说明文案。
 *
 * @param {HTMLElement} el
 * @param {'error' | 'perf'} activeId
 */
export function renderDemoTabHint(el, activeId) {
  const tab = DEMO_TABS.find((t) => t.id === activeId);
  el.textContent = tab?.description ?? '';
}
