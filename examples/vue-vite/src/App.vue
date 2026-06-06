<script setup lang="ts">
import * as Sentry from '@sentry-guardian/browser';
import * as SentryPerf from '@sentry-guardian/browser/performance';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { DEMO_TABS, navigateDemoTab, normalizeDemoPath, resolveDemoTab } from '../../shared/demo-routes.js';
import { buildErrorDemoGroups } from '../../shared/error-demos.js';
import { vueErrorDemoGroup } from '../../shared/error-demos-vue.js';
import { buildPerformanceDemoGroups } from '../../shared/performance-demos.js';

const dsn = import.meta.env.VITE_DSN as string | undefined;

const activeTab = ref<'error' | 'perf'>(normalizeDemoPath());

const tabHint = computed(
  () => DEMO_TABS.find((t) => t.id === activeTab.value)?.description ?? '',
);

const groups = computed(() => {
  if (activeTab.value === 'perf') {
    return buildPerformanceDemoGroups(SentryPerf);
  }
  return [...buildErrorDemoGroups(Sentry), vueErrorDemoGroup(() => throwVueError())];
});

function throwVueError() {
  throw new Error('[demo] Vue component error from SentryGuardian example');
}

function selectTab(tabId: 'error' | 'perf') {
  navigateDemoTab(tabId);
  activeTab.value = tabId;
}

function onPopState() {
  activeTab.value = resolveDemoTab();
}

onMounted(() => {
  window.addEventListener('popstate', onPopState);
});

onUnmounted(() => {
  window.removeEventListener('popstate', onPopState);
});

function runDemo(run: () => void | Promise<void>) {
  window.setTimeout(async () => {
    try {
      await run();
    } catch (err) {
      console.warn('[demo] caught', err);
    }
    await Sentry.flush(2000);
  }, 0);
}

function maskDsn(value: string) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/');
    const id = parts[parts.length - 1] ?? '';
    return `${url.origin}/…/${id.slice(0, 8)}…`;
  } catch {
    return '（无效 DSN）';
  }
}

const statusText = ref(
  dsn
    ? `SDK 已初始化（含性能集成）· release vue-example@0.1.0 · DSN ${maskDsn(dsn)}`
    : '未配置 VITE_DSN，SDK 未初始化。请复制 .env.example 并填入 DSN。',
);
</script>

<template>
  <div class="page">
    <header>
      <h1>SentryGuardian SDK 演示 · Vue</h1>
      <p>
        与 <code>examples/vanilla</code> 共用演示清单；<strong>错误</strong> Tab 额外包含
        <code>vueIntegration</code> 组件错误。
      </p>
      <div :class="['status', dsn ? 'status--ok' : 'status--warn']">{{ statusText }}</div>
    </header>

    <nav class="demo-tabs" role="tablist" aria-label="演示分类">
      <button
        v-for="tab in DEMO_TABS"
        :key="tab.id"
        type="button"
        class="demo-tab"
        :class="{ 'demo-tab--active': activeTab === tab.id }"
        role="tab"
        :aria-selected="activeTab === tab.id"
        @click="selectTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </nav>
    <p class="tab-hint">{{ tabHint }}</p>

    <section v-for="group in groups" :key="group.title" role="tabpanel">
      <h2>{{ group.title }}</h2>
      <p v-if="group.description" class="section-desc">{{ group.description }}</p>
      <div class="grid">
        <button
          v-for="demo in group.items"
          :key="demo.id"
          type="button"
          class="demo-btn"
          @click="runDemo(demo.run)"
        >
          <strong>{{ demo.label }}</strong>
          <span>{{ demo.description }}</span>
          <code>{{ demo.mechanism }}</code>
        </button>
      </div>
    </section>

    <footer>
      <p>
        CSP 违规请打开 vanilla 示例的
        <a href="http://localhost:5174/csp-lab.html" target="_blank" rel="noopener">csp-lab.html</a>
        （需先运行 vanilla 示例，端口 5174）。
      </p>
    </footer>
  </div>
</template>

<style scoped>
@import '../../vanilla/styles.css';

.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem;
}
</style>
