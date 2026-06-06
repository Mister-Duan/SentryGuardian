import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';

const selectClass =
  'mt-0.5 w-full rounded border border-[var(--sg-border)] bg-[var(--sg-surface)] px-2 py-1.5 text-sm text-[var(--sg-text)] outline-none focus:border-[var(--sg-accent)] focus:ring-1 focus:ring-[var(--sg-accent)]';

/** Primary button / 主按钮 */
export function Button({
  className = '',
  variant = 'default',
  size = 'sm',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}) {
  const variants = {
    default:
      'border border-[var(--sg-border)] bg-[var(--sg-surface)] text-[var(--sg-text)] hover:bg-[var(--sg-row-hover)]',
    primary: 'border-transparent text-white hover:opacity-90',
    ghost: 'border-transparent bg-transparent text-[var(--sg-text-muted)] hover:bg-black/5',
    danger: 'border-transparent bg-[var(--sg-danger)] text-white hover:opacity-90',
  };
  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };
  const primaryStyle = variant === 'primary' ? { background: 'var(--sg-accent)' } : undefined;

  return (
    <button
      style={primaryStyle}
      className={`inline-flex items-center justify-center rounded font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

/** Text input / 文本输入框 */
export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded border border-[var(--sg-border)] bg-[var(--sg-surface)] px-2 py-1.5 text-sm text-[var(--sg-text)] outline-none placeholder:text-[var(--sg-text-muted)] focus:border-[var(--sg-accent)] focus:ring-1 focus:ring-[var(--sg-accent)] ${className}`}
      {...props}
    />
  );
}

/** Native select with shared styling / 统一样式的下拉框 */
export function Select({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${selectClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

/** Surface card / 内容卡片 */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded border border-[var(--sg-border)] bg-[var(--sg-surface)] p-3 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Data table wrapper / 数据表格容器 */
export function Table({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full table-auto text-left text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-[var(--sg-border)] text-[11px] font-semibold uppercase tracking-wide text-[var(--sg-text-muted)]">
      {children}
    </thead>
  );
}

export function TableRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={`border-b border-[var(--sg-border)] last:border-0 hover:bg-[var(--sg-row-hover)] ${className}`}
    >
      {children}
    </tr>
  );
}

/** Compact filter toolbar row / 紧凑筛选工具栏 */
export function FilterBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-end gap-2 border-b border-[var(--sg-border)] pb-2 ${className}`}
    >
      {children}
    </div>
  );
}

export function FilterField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-[120px] flex-1 text-xs text-[var(--sg-text-muted)] ${className}`}>
      {label}
      {children}
    </label>
  );
}
