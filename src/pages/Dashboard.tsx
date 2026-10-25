import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData } from '../data'
import { allocSum, balances, kindMap, summarize } from '../lib/calc'
import { addDays, compact, idr, monthEnd, monthStart, shortDate, todayStr, weekStart } from '../lib/format'
import { Card, inputCls, SectionTitle, Stat } from '../components/ui'

export default function Dashboard() {
  const { accounts, categories, txs, allocs } = useData()
  const [date, setDate] = useState(todayStr())
  const kind = useMemo(() => kindMap(categories), [categories])
  const st = useMemo(() => balances(accounts, txs), [accounts, txs])
  const total = Object.values(st).reduce((s, a) => s + a.balance, 0)
  const seaId = accounts.find((a) => a.name === 'SeaBank')?.id
  const day = summarize(txs, kind, date, date)
  const ws = weekStart(date)
  const wk = summarize(txs, kind, ws, addDays(ws, 6))
  const mo = summarize(txs, kind, monthStart(date), monthEnd(date))
  const chart = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(date, i - 6)).map((d) => {
      const s = summarize(txs, kind, d, d)
      return { d: shortDate(d), Pendapatan: s.income, Pengeluaran: s.expense }
    }),
    [txs, kind, date],
  )

  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-brand-900 p-5 text-white">
        <div className="text-xs text-brand-200">Total saldo semua akun</div>
        <div className="mt-1 text-3xl font-extrabold tabular-nums">{idr(total)}</div>
        <div className="mt-3 flex items-center gap-2 text-xs text-brand-200">
          Lihat tanggal
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || todayStr())} className="rounded-lg bg-brand-800 px-2 py-1 text-white outline-none" />
        </div>
      </div>

      <SectionTitle>Hari ini</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Pendapatan kotor" value={day.income} tone="good" />
        <Stat label="Pengeluaran" value={day.expense} tone="bad" />
        <Stat label="Keuntungan bersih narik" value={day.net} tone={day.net >= 0 ? 'good' : 'bad'} sub="Pendapatan − biaya kerja" />
        <Stat label="Saldo SeaBank" value={seaId ? st[seaId]?.balance ?? 0 : 0} />
      </div>

      <SectionTitle>Bulan ini</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Pengeluaran operasional" value={mo.ops} />
        <Stat label="Pengeluaran pribadi" value={mo.personal} />
      </div>

      <SectionTitle>Alokasi tujuan (catatan virtual)</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Tabungan" value={allocSum(allocs, 'tabungan')} />
        <Stat label="Darurat" value={allocSum(allocs, 'darurat')} />
        <Stat label="Motor" value={allocSum(allocs, 'motor')} />
      </div>
      <p className="text-[11px] text-stone-500">Alokasi tidak menambah saldo. Saldo rekening di atas adalah angka aktual.</p>

      <SectionTitle>7 hari terakhir</SectionTitle>
      <Card className="!px-2">
        <div className="h-52">
          <ResponsiveContainer>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={compact} width={36} />
              <Tooltip formatter={(v: number) => idr(v)} />
              <Bar dataKey="Pendapatan" fill="#1f6b47" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill="#d6a29a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <SectionTitle>Ringkasan</SectionTitle>
      <Card className="overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-stone-100 text-left text-xs text-stone-500"><th className="p-3 font-medium"></th><th className="p-3 font-medium">Minggu</th><th className="p-3 font-medium">Bulan</th></tr></thead>
          <tbody className="tabular-nums">
            {([['Pendapatan kotor', 'income'], ['Biaya kerja', 'ops'], ['Untung bersih', 'net'], ['Pengeluaran pribadi', 'personal'], ['Sisa setelah semua', 'left']] as const).map(([l, k]) => (
              <tr key={k} className="border-b border-stone-50 last:border-0"><td className="p-3">{l}</td><td className="p-3">{idr(wk[k])}</td><td className="p-3">{idr(mo[k])}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
