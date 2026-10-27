'use client';
/** Shared building blocks for PMS admin pages — same look as the existing admin panel. */
import { useCallback, useEffect, useState, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ButtonHTMLAttributes } from 'react';
import { X, RefreshCw } from 'lucide-react';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function formatGHS(pesewas: number | null | undefined) {
  const v = (pesewas ?? 0) / 100;
  return `GH₵ ${v.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(d: string | Date | null | undefined, withTime = false) {
  if (!d) return '—';
  const date = typeof d === 'string' && d.length === 10 ? new Date(d + 'T00:00:00') : new Date(d);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className, padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={cx('bg-white rounded-xl border border-gray-200', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {actions}
        </div>
      )}
      <div className={padded ? 'p-6' : ''}>{children}</div>
    </div>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-lime-400 hover:bg-lime-500 text-slate-900',
  secondary: 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700',
  danger: 'bg-red-50 border border-red-200 hover:bg-red-100 text-red-700',
  ghost: 'hover:bg-gray-100 text-gray-600',
};

export function Button({ variant = 'primary', loading, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cx('inline-flex items-center justify-center gap-2 font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60', BTN[variant], className)}
    >
      {loading && <RefreshCw size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

const fieldCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-gray-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(fieldCls, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cx(fieldCls, props.className)} />;
}

export function Select({ options, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string | number; label: string }[] }) {
  return (
    <select {...props} className={cx(fieldCls, props.className)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

const BADGE: Record<string, string> = {
  green: 'bg-lime-100 text-lime-800', blue: 'bg-blue-100 text-blue-800', amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700', gray: 'bg-gray-100 text-gray-600', purple: 'bg-purple-100 text-purple-800',
};

export function Badge({ color = 'gray', children }: { color?: keyof typeof BADGE | string; children: ReactNode }) {
  return <span className={cx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', BADGE[color] ?? BADGE.gray)}>{children}</span>;
}

export const STATUS_COLORS: Record<string, string> = {
  held: 'amber', pending_payment: 'amber', confirmed: 'blue', checked_in: 'green', checked_out: 'gray',
  expired: 'gray', cancelled: 'red', clean: 'green', dirty: 'red', in_progress: 'amber', out_of_order: 'purple',
  lead: 'gray', quoted: 'blue', deposit_paid: 'amber', lost: 'red', open: 'red', resolved: 'green',
  received: 'amber', preparing: 'blue', delivered: 'green', requested: 'amber', completed: 'green', no_show: 'red',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge color={STATUS_COLORS[status] ?? 'gray'}>{status.replace(/_/g, ' ')}</Badge>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" onClick={onClose}>
      <div className={cx('bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-auto', wide ? 'max-w-3xl' : 'max-w-lg')} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="text-center py-12 text-gray-400 text-sm">{children}</div>;
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="text-red-600 text-sm">{children}</p>;
}

export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

/** Load JSON from an admin API; returns { data, loading, error, reload }. */
export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      setData(await api<T>(url));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url]);
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload, setData };
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
            {head.map((h, i) => <th key={i} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cx('px-4 py-3 align-top', className)}>{children}</td>;
}
