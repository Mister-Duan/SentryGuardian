import type { Client, Integration } from '@sentry-guardian/core';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Dedupe key for a single CSP violation burst (document + window listeners).
 * 单次 CSP 违规去重键（document / window 双监听）。
 */
function isCspViolationEvent(event: Event): event is SecurityPolicyViolationEvent {
  return (
    event.type === 'securitypolicyviolation' &&
    'violatedDirective' in event &&
    typeof (event as SecurityPolicyViolationEvent).violatedDirective === 'string'
  );
}

function violationKey(event: SecurityPolicyViolationEvent): string {
  const directive = event.effectiveDirective || event.violatedDirective;
  return [
    directive,
    event.blockedURI,
    event.sourceFile,
    event.lineNumber,
    event.columnNumber,
  ].join('|');
}

/**
 * Capture Content Security Policy violations.
 * 捕获内容安全策略（CSP）违规。
 *
 * @example
 * ```ts
 * // Input / 输入
 * cspErrorsIntegration().name
 * // Output / 输出
 * 'CspErrors'
 * ```
 */
export function cspErrorsIntegration(): Integration {
  let listenersAttached = false;

  return {
    name: 'CspErrors',
    setup(client: Client) {
      if (!isBrowser() || listenersAttached) {
        return;
      }
      listenersAttached = true;

      const recentKeys = new Map<string, number>();
      const DEDUPE_MS = 100;

      const onViolation = (event: Event) => {
        if (!isCspViolationEvent(event)) {
          return;
        }

        const key = violationKey(event);
        const now = Date.now();
        const last = recentKeys.get(key);
        if (last != null && now - last < DEDUPE_MS) {
          return;
        }
        recentKeys.set(key, now);

        const directive = event.effectiveDirective || event.violatedDirective || 'unknown';
        const message = `CSP violation: ${directive}`;
        client.captureException(message, {
          mechanism: 'onsecuritypolicyviolation',
          tags: {
            'error.type': 'csp',
            'csp.directive': directive,
          },
          extra: {
            blockedURI: event.blockedURI,
            documentURI: event.documentURI,
            sourceFile: event.sourceFile,
            lineNumber: event.lineNumber,
            columnNumber: event.columnNumber,
            violatedDirective: event.violatedDirective,
            effectiveDirective: event.effectiveDirective,
            originalPolicy: event.originalPolicy,
            disposition: event.disposition,
            referrer: event.referrer,
            sample: event.sample,
          },
          syntheticLocation: event.sourceFile
            ? {
                filename: event.sourceFile,
                lineno: event.lineNumber,
                colno: event.columnNumber,
              }
            : undefined,
        });
      };

      // Window + document: Safari / Chrome differ on dispatch target; event may bubble.
      // Window + document：Safari / Chrome 派发目标不同，事件会冒泡。
      window.addEventListener('securitypolicyviolation', onViolation);
      document.addEventListener('securitypolicyviolation', onViolation);
    },
  };
}
