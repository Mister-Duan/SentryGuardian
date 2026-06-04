import type { ErrorEvent } from '@sentry-guardian/types';

/** Hook to mutate or drop an event before send. 发送前修改或丢弃事件的钩子。 */
export type BeforeSendFn = (event: ErrorEvent) => ErrorEvent | null;

/**
 * Chain of beforeSend processors.
 * beforeSend 处理器链。
 */
export class EventProcessor {
  private processors: BeforeSendFn[] = [];

  add(processor: BeforeSendFn): void {
    this.processors.push(processor);
  }

  /**
   * Run all processors; return null if any processor drops the event.
   * 依次执行处理器；任一返回 null 则丢弃事件。
   *
   * @example
   * ```ts
   * // Input / 输入
   * const p = new EventProcessor();
   * p.add((e) => (e.level === 'info' ? null : e));
   * p.process({ ...event, level: 'info' })
   * // Output / 输出
   * null
   * ```
   */
  process(event: ErrorEvent): ErrorEvent | null {
    let current: ErrorEvent | null = event;
    for (const processor of this.processors) {
      if (!current) break;
      current = processor(current);
    }
    return current;
  }
}
