import type { ErrorEvent, StackFrame } from '@sentry-guardian/types';
import { SourceMapConsumer } from 'source-map';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import { Injectable } from '@nestjs/common';

/**
 * Resolve minified stack frames using uploaded source maps.
 * 使用已上传 Source Map 解析压缩栈帧。
 */
@Injectable()
export class SymbolicatorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Symbolicate all exception frames in an error event.
   * 对错误事件中所有异常帧做符号化。
   *
   * @example
   * ```ts
   * // Input / 输入
   * await service.symbolicateEvent('proj_1', errorEvent)
   * // Output / 输出
   * ErrorEvent with original source paths when maps exist
   * ```
   */
  async symbolicateEvent(projectId: string, event: ErrorEvent): Promise<ErrorEvent> {
    const release = event.release;
    if (!release || !event.exception?.values?.length) {
      return event;
    }

    const rel = await this.prisma.release.findUnique({
      where: { projectId_version: { projectId, version: release } },
      include: { artifacts: true },
    });
    if (!rel?.artifacts.length) {
      return event;
    }

    const consumers = new Map<string, SourceMapConsumer>();
    for (const artifact of rel.artifacts) {
      try {
        const consumer = await new SourceMapConsumer(artifact.sourceMap);
        consumers.set(artifact.name, consumer);
      } catch {
        // skip invalid maps
      }
    }

    const values = await Promise.all(
      event.exception.values.map(async (ex) => {
        if (!ex.stacktrace?.frames?.length) {
          return ex;
        }
        const frames = await Promise.all(
          ex.stacktrace.frames.map((frame) => this.symbolicateFrame(frame, consumers)),
        );
        return { ...ex, stacktrace: { frames } };
      }),
    );

    for (const c of consumers.values()) {
      c.destroy();
    }

    return { ...event, exception: { values } };
  }

  private async symbolicateFrame(
    frame: StackFrame,
    consumers: Map<string, SourceMapConsumer>,
  ): Promise<StackFrame> {
    const filename = frame.filename ?? '';
    const mapName = filename.endsWith('.map') ? filename : `${filename}.map`;
    const baseName = mapName.split('/').pop() ?? mapName;
    const consumer =
      consumers.get(baseName) ??
      consumers.get(mapName) ??
      [...consumers.values()].find((_, i) => i === 0 && consumers.size === 1);
    if (!consumer || frame.lineno == null) {
      return frame;
    }
    const col = Math.max(0, (frame.colno ?? 1) - 1);
    const line = Math.max(0, frame.lineno - 1);
    const pos = consumer.originalPositionFor({ line, column: col });
    if (!pos.source) {
      return frame;
    }
    return {
      ...frame,
      filename: pos.source.replace(/^webpack:\/\/\//, ''),
      function: pos.name ?? frame.function,
      lineno: pos.line ?? frame.lineno,
      colno: pos.column != null ? pos.column + 1 : frame.colno,
      in_app: true,
    };
  }
}
