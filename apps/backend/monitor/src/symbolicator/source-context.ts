import type { StackFrameContextLine } from '@sentry-guardian/types';
import type { SourceMapConsumer } from 'source-map';
import { basename, normalizeSourcePath } from './symbolicator.logic.js';

/**
 * Extract source context lines around an error position.
 * 提取出错位置附近的源码上下文行。
 *
 * @example
 * ```ts
 * // Input / 输入
 * extractSourceContext(consumer, 'src/app.ts', 10, 4, 2)
 * // Output / 输出
 * [{ line_no: 8, content: '...' }, { line_no: 10, content: '...', is_error_line: true }]
 * ```
 */
export function extractSourceContext(
  consumer: SourceMapConsumer,
  source: string,
  line: number | null | undefined,
  _column: number | null | undefined,
  radius = 5,
  externalSources?: Map<string, string>,
): StackFrameContextLine[] {
  if (line == null || line < 1) {
    return [];
  }

  const normalized = normalizeSourcePath(source);
  let content = consumer.sourceContentFor(source, true);
  if (content == null && externalSources) {
    content =
      externalSources.get(normalized) ??
      externalSources.get(basename(normalized)) ??
      externalSources.get(source) ??
      null;
  }
  if (content == null) {
    return [];
  }

  const lines = content.split(/\r?\n/);
  const errorIndex = line - 1;
  const start = Math.max(0, errorIndex - radius);
  const end = Math.min(lines.length - 1, errorIndex + radius);
  const result: StackFrameContextLine[] = [];

  for (let i = start; i <= end; i += 1) {
    result.push({
      line_no: i + 1,
      content: lines[i] ?? '',
      is_error_line: i === errorIndex,
    });
  }

  return result;
}
