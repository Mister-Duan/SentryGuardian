<script setup lang="ts">
import * as Sentry from '@sentry-guardian/browser';
import { computed, ref } from 'vue';
import { buildErrorDemoGroups } from '../../shared/error-demos.js';
import { vueErrorDemoGroup } from '../../shared/error-demos-vue.js';

const dsn = import.meta.env.VITE_DSN as string | undefined;

const groups = computed(() => {
  const base = buildErrorDemoGroups(Sentry);
  return [...base, vueErrorDemoGroup(() => throwVueError())];
});

function throwVueError() {
  throw new Error('[demo] Vue component error from SentryGuardian example');
}

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
    ? `SDK 已初始化 · release vue-example@0.1.0 · DSN ${maskDsn(dsn)}`
    : '未配置 VITE_DSN，SDK 未初始化。请复制 .env.example 并填入 DSN。',
);
</script>

<template>
  <div class="page">
    <header>
      <h1>SentryGuardian 浏览器错误类型演示 · Vue</h1>
      <p>
        与 <code>examples/vanilla</code> 共用演示清单，并额外包含
        <code>vueIntegration</code> 捕获的组件错误。
      </p>
      <div :class="['status', dsn ? 'status--ok' : 'status--warn']">{{ statusText }}</div>
    </header>

    <section v-for="group in groups" :key="group.title">
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
        CSP 违规请打开同仓库 vanilla 示例的
        <a href="http://localhost:5174/csp-lab.html" target="_blank" rel="noopener">csp-lab.html</a>
        （需先运行 vanilla 示例）。
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
