import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

/** shadcn-style button (minimal). 精简版 shadcn 风格按钮。 */
export function Button({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

/** shadcn-style input (minimal). 精简版 shadcn 风格输入框。 */
export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500 ${className}`}
      {...props}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
