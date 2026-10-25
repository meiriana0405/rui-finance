import { ButtonHTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'
import { idr } from '../lib/format'

export const inputCls =
  'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-stone-200/70 bg-white p-4 ${className}`}>{children}</div>
)

export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold text-stone-600">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
  </label>
)

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }
export const Btn = ({ variant = 'primary', className = '', ...p }: BtnProps) => {
  const v = {
    primary: 'bg-brand-800 text-white hover:bg-brand-900',
    ghost: 'bg-stone-100 text-stone-800 hover:bg-stone-200',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
  }[variant]
  return <button type="button" {...p} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${v} ${className}`} />
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div className="safe-bottom max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-stone-50 p-4 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-brand-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-stone-200" aria-label="Tutup"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function MoneyInput({ value, onChange, placeholder = '0' }: { value: number; onChange: (n: number) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">Rp</span>
      <input
        inputMode="numeric"
        className={`${inputCls} pl-9`}
        placeholder={placeholder}
        value={value ? value.toLocaleString('id-ID') : ''}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
      />
    </div>
  )
}

export const Stat = ({ label, value, tone = 'default', sub }: { label: string; value: number; tone?: 'default' | 'good' | 'bad'; sub?: string }) => (
  <Card className="!p-3">
    <div className="text-xs text-stone-500">{label}</div>
    <div className={`mt-0.5 text-lg font-bold tabular-nums ${tone === 'good' ? 'text-brand-700' : tone === 'bad' ? 'text-red-600' : 'text-stone-900'}`}>{idr(value)}</div>
    {sub && <div className="text-[11px] text-stone-500">{sub}</div>}
  </Card>
)

export const SectionTitle = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="mb-2 mt-5 flex items-center justify-between">
    <h2 className="text-sm font-bold text-brand-900">{children}</h2>
    {action}
  </div>
)

export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">{children}</div>
)
