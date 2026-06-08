/**
 * Minified or original file location for a stack frame.
 * 栈帧对应的文件位置（压缩或原始）。
 */
export interface StackFrameLocation {
  /** Source file path or URL. 源文件路径或 URL。 */
  filename?: string;
  /** 1-based line number. 行号（从 1 起）。 */
  lineno?: number;
  /** 1-based column number. 列号（从 1 起）。 */
  colno?: number;
}

/**
 * One line of source context around an error location.
 * 出错位置附近的单行源码上下文。
 */
export interface StackFrameContextLine {
  /** 1-based line number in the source file. 源文件中的行号（从 1 起）。 */
  line_no: number;
  /** Source line text. 源码行文本。 */
  content: string;
  /** Whether this line is the error line. 是否为出错行。 */
  is_error_line?: boolean;
}

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
  /** Location before symbolication (minified bundle). 符号化前的压缩位置。 */
  raw?: StackFrameLocation;
  /** Whether this frame was symbolicated via Source Map. 是否已通过 Source Map 符号化。 */
  symbolicated?: boolean;
  /** Whether a Source Map was matched for this frame. 是否匹配到 Source Map。 */
  map_matched?: boolean;
  /** Source lines around the error for quick debugging. 出错行附近的源码上下文。 */
  context?: StackFrameContextLine[];
}
