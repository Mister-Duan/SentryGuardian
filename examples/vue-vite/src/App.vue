<script setup lang="ts">
function throwError() {
  throw new Error('Vue test error from SentryGuardian example');
}
</script>

<template>
  <main style="font-family: system-ui; padding: 2rem">
    <h1>SentryGuardian Vue Example</h1>
    <p>Set <code>VITE_DSN</code> then click the button to send a test error.</p>
    <button type="button" @click="throwError">Throw test error</button>
  </main>
</template>
