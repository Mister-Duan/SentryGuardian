import type { Breadcrumb, User } from '@sentry-guardian/types';

/**
 * Mutable event context (user, tags, breadcrumbs).
 * 可变事件上下文（用户、标签、面包屑）。
 */
export class Scope {
  private _user: User | undefined;
  private _tags: Record<string, string> = {};
  private _extra: Record<string, unknown> = {};
  private _breadcrumbs: Breadcrumb[] = [];
  maxBreadcrumbs = 100;

  /**
   * Clone scope for isolated mutations.
   * 克隆 Scope 以便隔离修改。
   *
   * @example
   * ```ts
   * // Input / 输入
   * new Scope().setTag('k', 'v').clone().getTags()
   * // Output / 输出
   * { k: 'v' }
   * ```
   */
  clone(): Scope {
    const copy = new Scope();
    copy._user = this._user ? { ...this._user } : undefined;
    copy._tags = { ...this._tags };
    copy._extra = { ...this._extra };
    copy._breadcrumbs = [...this._breadcrumbs];
    copy.maxBreadcrumbs = this.maxBreadcrumbs;
    return copy;
  }

  setUser(user: User | null): this {
    this._user = user ?? undefined;
    return this;
  }

  setTag(key: string, value: string): this {
    this._tags[key] = value;
    return this;
  }

  setExtra(key: string, value: unknown): this {
    this._extra[key] = value;
    return this;
  }

  addBreadcrumb(breadcrumb: Breadcrumb): this {
    this._breadcrumbs.push(breadcrumb);
    if (this._breadcrumbs.length > this.maxBreadcrumbs) {
      this._breadcrumbs.shift();
    }
    return this;
  }

  getUser(): User | undefined {
    return this._user;
  }

  getTags(): Record<string, string> {
    return { ...this._tags };
  }

  getExtra(): Record<string, unknown> {
    return { ...this._extra };
  }

  getBreadcrumbs(): Breadcrumb[] {
    return [...this._breadcrumbs];
  }

  clearBreadcrumbs(): this {
    this._breadcrumbs = [];
    return this;
  }
}

/**
 * Stack of scopes for nested context.
 * 用于嵌套上下文的 Scope 栈。
 */
export class ScopeStack {
  private stack: Scope[] = [new Scope()];

  push(scope: Scope): void {
    this.stack.push(scope);
  }

  pop(): Scope | undefined {
    if (this.stack.length <= 1) return undefined;
    return this.stack.pop();
  }

  get(): Scope {
    return this.stack[this.stack.length - 1]!;
  }

  /**
   * Run callback with a cloned scope, then restore previous scope.
   * 在克隆 Scope 上执行回调，结束后恢复上一层。
   *
   * @example
   * ```ts
   * // Input / 输入
   * const stack = new ScopeStack();
   * stack.withScope((s) => { s.setTag('a', '1'); return s.getTags(); })
   * // Output / 输出
   * { a: '1' }
   * ```
   */
  withScope<T>(callback: (scope: Scope) => T): T {
    const scope = this.get().clone();
    this.push(scope);
    try {
      return callback(scope);
    } finally {
      this.pop();
    }
  }
}
