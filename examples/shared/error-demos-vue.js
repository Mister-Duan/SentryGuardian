/**
 * Vue-specific error demo group (vueIntegration errorHandler).
 * Vue 专用错误演示分组（vueIntegration errorHandler）。
 *
 * @param {() => void} throwInComponent Callback that throws inside Vue render/handler / 在 Vue 中抛错的回调
 * @returns {import('./error-demos.js').ErrorDemoGroup}
 *
 * @example
 * ```js
 * // Input / 输入
 * vueErrorDemoGroup(() => { throw new Error('vue'); }).title
 * // Output / 输出
 * 'Vue 3'
 * ```
 */
export function vueErrorDemoGroup(throwInComponent) {
  return {
    title: 'Vue 3',
    description: 'vueIntegration · Vue errorHandler',
    items: [
      {
        id: 'vue-throw',
        label: '组件内 throw',
        mechanism: 'vue · generic',
        description: '经 Vue errorHandler 再 captureException',
        run: throwInComponent,
      },
    ],
  };
}
