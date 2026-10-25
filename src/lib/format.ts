export const idr = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

export const compact = (v: number) => (Math.abs(v) >= 1e6 ? `${+(v / 1e6).toFixed(1)}jt` : Math.abs(v) >= 1e3 ? `${Math.round(v / 1e3)}rb` : `${v}`)

export const todayStr = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })

const toDate = (s: string) => new Date(s + 'T00:00:00Z')
const fmt = (d: Date) => d.toISOString().slice(0, 10)

export const addDays = (s: string, n: number) => { const d = toDate(s); d.setUTCDate(d.getUTCDate() + n); return fmt(d) }
export const weekStart = (s: string) => addDays(s, -((toDate(s).getUTCDay() + 6) % 7)) // Senin
export const monthStart = (s: string) => s.slice(0, 8) + '01'
export const monthEnd = (s: string) => { const d = toDate(monthStart(s)); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0); return fmt(d) }
export const weekday = (s: string) => toDate(s).getUTCDay() // 0 = Minggu

export const dateLabel = (s: string) =>
  toDate(s).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
export const shortDate = (s: string) => toDate(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export function eachDay(from: string, to: string) {
  const out: string[] = []
  for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(d)
  return out
}
