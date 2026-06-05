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
  /** Max breadcrumbs before oldest entries are removed. 超出后移除最旧条目的面包屑上限。 */
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

  /**
   * Set or clear the user on this scope.
   * 设置或清空本 Scope 上的用户。
   *
   * @example
   * ```ts
   * // Input / 输入
   * new Scope().setUser({ id: '1' }).getUser()
   * // Output / 输出
   * { id: '1' }
   * ```
   */
  setUser(user: User | null): this {
    this._user = user ?? undefined;
    return this;
  }

  /**
   * Set a searchable tag on this scope.
   * 在本 Scope 上设置可检索标签。
   *
   * @example
   * ```ts
   * // Input / 输入
   * new Scope().setTag('page', 'checkout').getTags()
   * // Output / 输出
   * { page: 'checkout' }
   * ```
   */
  setTag(key: string, value: string): this {
    this._tags[key] = value;
    return this;
  }

  /**
   * Attach arbitrary diagnostic data to this scope.
   * 在本 Scope 上附加任意诊断数据。
   *
   * @example
   * ```ts
   * // Input / 输入
   * new Scope().setExtra('cartId', 'c-9').getExtra()
   * // Output / 输出
   * { cartId: 'c-9' }
   * ```
   */
  setExtra(key: string, value: unknown): this {
    this._extra[key] = value;
    return this;
  }

  /**
   * Append a breadcrumb; drops oldest when over {@link maxBreadcrumbs}.
   * 追加面包屑；超过 {@link maxBreadcrumbs} 时丢弃最旧。
   *
   * @example
   * ```ts
   * // Input / 输入
   * new Scope().addBreadcrumb({ message: 'clicked' }).getBreadcrumbs().length
   * // Output / 输出
   * 1
   * ```
   */
  addBreadcrumb(breadcrumb: Breadcrumb): this {
    this._breadcrumbs.push(breadcrumb);
    if (this._breadcrumbs.length > this.maxBreadcrumbs) {
      this._breadcrumbs.shift();
    }
    return this;
  }

  /** Return a shallow copy of the current user. 返回当前用户的浅拷贝。 */
  getUser(): User | undefined {
    return this._user;
  }

  /** Return a shallow copy of all tags. 返回所有标签的浅拷贝。 */
  getTags(): Record<string, string> {
    return { ...this._tags };
  }

  /** Return a shallow copy of all extra fields. 返回所有 extra 字段的浅拷贝。 */
  getExtra(): Record<string, unknown> {
    return { ...this._extra };
  }

  /** Return a copy of the breadcrumb list. 返回面包屑列表的拷贝。 */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this._breadcrumbs];
  }

  /**
   * Remove all breadcrumbs from this scope.
   * 清空本 Scope 上的所有面包屑。
   *
   * @example
   * ```ts
   * // Input / 输入
   * new Scope().addBreadcrumb({}).clearBreadcrumbs().getBreadcrumbs().length
   * // Output / 输出
   * 0
   * ```
   */
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

  /**
   * Push a scope onto the stack (used internally by {@link withScope}).
   * 将 Scope 压栈（通常由 {@link withScope} 内部使用）。
   */
  push(scope: Scope): void {
    this.stack.push(scope);
  }

  /**
   * Pop the top scope; no-op when only the root remains.
   * 弹出栈顶 Scope；仅剩根 Scope 时不操作。
   */
  pop(): Scope | undefined {
    if (this.stack.length <= 1) return undefined;
    return this.stack.pop();
  }

  /**
   * Get the current (top) scope.
   * 获取当前（栈顶）Scope。
   *
   * @example
   * ```ts
   * // Input / 输入
   * new ScopeStack().get().setTag('a', '1').getTags()
   * // Output / 输出
   * { a: '1' }
   * ```
   */
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
