/**
 * Stack frame in an exception stacktrace.
 * 异常堆栈中的栈帧。
 */
export interface StackFrame {
  /** Source file path. 源文件路径。 */
  filename?: string;
  /** Function or symbol name. 函数或符号名。 */
  function?: string;
  /** Module name, if available. 模块名（若有）。 */
  module?: string;
  /** 1-based line number. 行号（从 1 起）。 */
  lineno?: number;
  /** 1-based column number. 列号（从 1 起）。 */
  colno?: number;
  /** Whether the frame belongs to application code. 是否属于应用代码帧。 */
  in_app?: boolean;
}
