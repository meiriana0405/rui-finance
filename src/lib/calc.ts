import { Account, Alloc, Category, PosKey, Settings, Tx } from './types'
import { addDays, eachDay, monthEnd, monthStart, todayStr, weekStart, weekday } from './format'

export const POS: { key: PosKey; label: string; where: string }[] = [
  { key: 'harian', label: 'Kebutuhan harian & kuliah', where: 'BCA' },
  { key: 'tabungan', label: 'Tabungan utama', where: 'SeaBank' },
  { key: 'motor', label: 'Perawatan motor', where: 'SeaBank' },
  { key: 'jajan', label: 'Uang jajan', where: 'ShopeePay' },
  { key: 'darurat', label: 'Dana darurat', where: 'DANA' },
]

export type AccStat = { balance: number; income: number; expense: number; transferIn: number; transferOut: number }

// Saldo selalu dihitung dari transaksi, jadi edit/hapus otomatis memperbarui saldo.
export function balances(accounts: Account[], txs: Tx[]) {
  const m: Record<string, AccStat> = {}
  accounts.forEach((a) => (m[a.id] = { balance: a.initial_balance, income: 0, expense: 0, transferIn: 0, transferOut: 0 }))
  for (const t of txs) {
    const a = m[t.account_id]
    if (t.type === 'income' && a) { a.income += t.amount; a.balance += t.amount }
    if (t.type === 'expense' && a) { a.expense += t.amount; a.balance -= t.amount }
    if (t.type === 'transfer') {
      if (a) { a.transferOut += t.amount; a.balance -= t.amount }
      const b = t.to_account_id ? m[t.to_account_id] : undefined
      if (b) { b.transferIn += t.amount; b.balance += t.amount }
    }
  }
  return m
}

export const kindMap = (cats: Category[]) => new Map(cats.map((c) => [c.id, c.kind]))

// Transfer tidak ikut dihitung sebagai pemasukan/pengeluaran.
export function summarize(txs: Tx[], kind: Map<string, string>, from: string, to: string) {
  let income = 0, ops = 0, personal = 0
  for (const t of txs) {
    if (t.date < from || t.date > to) continue
    if (t.type === 'income') income += t.amount
    if (t.type === 'expense') (t.category_id && kind.get(t.category_id) === 'operasional' ? (ops += t.amount) : (personal += t.amount))
  }
  const net = income - ops
  return { income, ops, personal, expense: ops + personal, net, left: net - personal }
}

export const fuelPerDay = (s: Settings) => Math.round((s.daily_km / s.km_per_liter) * s.fuel_price)
export const workDaysInMonth = (date: string, days: number[]) =>
  eachDay(monthStart(date), monthEnd(date)).filter((d) => days.includes(weekday(d))).length

// Bagi uang; sisa pembulatan masuk ke pos "harian" sehingga total selalu tepat.
export function splitAlloc(base: number, pct: Record<PosKey, number>): Record<PosKey, number> {
  const keys = POS.map((p) => p.key)
  const total = keys.reduce((s, k) => s + (pct[k] || 0), 0) || 1
  const out = {} as Record<PosKey, number>
  let used = 0
  keys.forEach((k) => { out[k] = Math.floor((base * (pct[k] || 0)) / total); used += out[k] })
  out.harian += base - used
  return out
}

export const allocSum = (allocs: Alloc[], pos: PosKey, upTo?: string) =>
  allocs.filter((a) => a.pos === pos && (!upTo || a.date <= upTo)).reduce((s, a) => s + a.amount, 0)

export function periodRange(p: string, from: string, to: string): [string, string] {
  const t = todayStr()
  if (p === 'today') return [t, t]
  if (p === 'yesterday') return [addDays(t, -1), addDays(t, -1)]
  if (p === 'week') return [weekStart(t), t]
  if (p === 'month') return [monthStart(t), t]
  return [from || '0000-01-01', to || '9999-12-31']
}

export const PERIODS = [
  { v: 'today', l: 'Hari ini' }, { v: 'yesterday', l: 'Kemarin' }, { v: 'week', l: 'Minggu ini' },
  { v: 'month', l: 'Bulan ini' }, { v: 'range', l: 'Rentang tanggal' },
]
