import type { ErrorEvent, StackFrame } from '@sentry-guardian/types';
import { SourceMapConsumer } from 'source-map';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { extractSourceContext } from './source-context.js';
import {
  buildArtifactIndex,
  inferInAppFromPath,
  normalizeSourcePath,
  resolveArtifactForFrame,
  type ArtifactIndex,
  type SymbolicatorArtifact,
} from './symbolicator.logic.js';

/**
 * Resolve minified stack frames using uploaded source maps.
 * 使用已上传 Source Map 解析压缩栈帧。
 */
@Injectable()
export class SymbolicatorService implements OnModuleDestroy {
  private readonly releaseCache = new Map<
    string,
    { expiresAt: number; index: ArtifactIndex; consumers: Map<string, SourceMapConsumer> }
  >();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Symbolicate all exception frames in an error event.
   * 对错误事件中所有异常帧做符号化。
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
      return markUnmatchedFrames(event);
    }

    const artifacts: SymbolicatorArtifact[] = rel.artifacts.map((a) => ({
      name: a.name,
      sourceMap: a.sourceMap,
      bundleUrl: a.bundleUrl,
      debugId: a.debugId,
      artifactType: a.artifactType,
    }));

    const cacheKey = `${projectId}:${release}`;
    const cached = this.releaseCache.get(cacheKey);
    let index: ArtifactIndex;
    let consumers: Map<string, SourceMapConsumer>;
    if (cached && cached.expiresAt > Date.now()) {
      index = cached.index;
      consumers = cached.consumers;
    } else {
      index = buildArtifactIndex(artifacts);
      consumers = await this.loadConsumers(index.maps);
      this.releaseCache.set(cacheKey, {
        expiresAt: Date.now() + 5 * 60_000,
        index,
        consumers,
      });
    }

    const values = await Promise.all(
      event.exception.values.map(async (ex) => {
        if (!ex.stacktrace?.frames?.length) {
          return ex;
        }
        const frames = await Promise.all(
          ex.stacktrace.frames.map((frame) =>
            this.symbolicateFrame(frame, index, consumers),
          ),
        );
        return { ...ex, stacktrace: { frames } };
      }),
    );

    return { ...event, exception: { values } };
  }

  onModuleDestroy(): void {
    for (const entry of this.releaseCache.values()) {
      for (const c of entry.consumers.values()) {
        c.destroy();
      }
    }
    this.releaseCache.clear();
  }

  private async loadConsumers(
    maps: SymbolicatorArtifact[],
  ): Promise<Map<string, SourceMapConsumer>> {
    const consumers = new Map<string, SourceMapConsumer>();
    for (const artifact of maps) {
      try {
        const consumer = await new SourceMapConsumer(artifact.sourceMap);
        consumers.set(artifact.name, consumer);
      } catch {
        // skip invalid maps
      }
    }
    return consumers;
  }

  private async symbolicateFrame(
    frame: StackFrame,
    index: ArtifactIndex,
    consumers: Map<string, SourceMapConsumer>,
  ): Promise<StackFrame> {
    const artifact = resolveArtifactForFrame(frame, index);
    if (!artifact) {
      return { ...frame, map_matched: false, symbolicated: false };
    }

    const consumer = consumers.get(artifact.name);
    if (!consumer || frame.lineno == null || frame.lineno < 1) {
      return { ...frame, map_matched: false, symbolicated: false };
    }

    // source-map originalPositionFor: generated line is 1-based, column is 0-based.
    const line = frame.lineno;
    const col = Math.max(0, (frame.colno ?? 1) - 1);
    let pos;
    try {
      pos = consumer.originalPositionFor({ line, column: col });
    } catch {
      return { ...frame, map_matched: true, symbolicated: false };
    }
    if (!pos.source) {
      return { ...frame, map_matched: true, symbolicated: false };
    }

    const raw = {
      filename: frame.filename,
      lineno: frame.lineno,
      colno: frame.colno,
    };
    const filename = normalizeSourcePath(pos.source);
    const inApp =
      frame.in_app === false ? false : inferInAppFromPath(filename) ? true : frame.in_app;

    const context = extractSourceContext(
      consumer,
      pos.source,
      pos.line,
      pos.column,
      5,
      index.sources,
    );

    return {
      ...frame,
      raw,
      filename,
      function: pos.name ?? frame.function,
      lineno: pos.line ?? frame.lineno,
      colno: pos.column != null ? pos.column + 1 : frame.colno,
      in_app: inApp,
      symbolicated: true,
      map_matched: true,
      context: context.length > 0 ? context : undefined,
    };
  }
}

function markUnmatchedFrames(event: ErrorEvent): ErrorEvent {
  if (!event.exception?.values?.length) {
    return event;
  }
  const values = event.exception.values.map((ex) => {
    if (!ex.stacktrace?.frames?.length) {
      return ex;
    }
    return {
      ...ex,
      stacktrace: {
        frames: ex.stacktrace.frames.map((frame) => ({
          ...frame,
          map_matched: false,
        })),
      },
    };
  });
  return { ...event, exception: { values } };
}
