import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from 'recharts'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { useData } from '../data'
import { allocSum, balances, kindMap, periodRange, PERIODS, summarize } from '../lib/calc'
import { compact, eachDay, idr, shortDate } from '../lib/format'
import { exportCsv, exportPdf, TX_HEAD, txRows } from '../lib/export'
import { Btn, Card, inputCls, SectionTitle, Stat } from '../components/ui'

export default function Reports() {
  const { accounts, categories, txs, allocs } = useData()
  const [period, setPeriod] = useState('month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [f, t] = periodRange(period, from, to)
  const kind = useMemo(() => kindMap(categories), [categories])
  const s = summarize(txs, kind, f, t)
  const st = useMemo(() => balances(accounts, txs), [accounts, txs])
  const inRange = txs.filter((x) => x.date >= f && x.date <= t)

  const byCat = useMemo(() => {
    const m = new Map<string, number>()
    inRange.filter((x) => x.type === 'expense').forEach((x) => m.set(x.category_id ?? '', (m.get(x.category_id ?? '') ?? 0) + x.amount))
    return [...m.entries()].map(([id, v]) => ({ name: categories.find((c) => c.id === id)?.name ?? 'Tanpa kategori', v, ops: kind.get(id) === 'operasional' })).sort((a, b) => b.v - a.v)
  }, [inRange, categories, kind])
  const maxCat = byCat[0]?.v || 1

  const days = useMemo(() => {
    const first = f < '1000' ? (txs[txs.length - 1]?.date ?? t) : f
    const last = t > '9000' ? (txs[0]?.date ?? first) : t
    return eachDay(first, last).slice(-62)
  }, [f, t, txs])
  const daily = days.map((d) => { const x = summarize(txs, kind, d, d); return { d: shortDate(d), Pendapatan: x.income, 'Untung bersih': x.net, Pribadi: x.personal } })
  const growth = days.map((d) => ({ d: shortDate(d), Tabungan: allocSum(allocs, 'tabungan', d), 'Dana darurat': allocSum(allocs, 'darurat', d) }))
  const sorted = [...inRange].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <select className={inputCls} value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIODS.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}</select>
        {period === 'range' && <div className="grid grid-cols-2 gap-2"><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /><input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></div>}
        <div className="grid grid-cols-2 gap-2">
          <Btn variant="ghost" className="flex items-center justify-center gap-2" onClick={() => exportCsv(TX_HEAD, txRows(sorted, accounts, categories), `rui-finance_${f}_${t}.csv`)}><FileSpreadsheet size={15} /> CSV</Btn>
          <Btn variant="ghost" className="flex items-center justify-center gap-2" onClick={() => exportPdf(`Rui Finance (${f} s/d ${t})`, TX_HEAD, txRows(sorted, accounts, categories), `rui-finance_${f}_${t}.pdf`)}><FileDown size={15} /> PDF</Btn>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Pendapatan kotor" value={s.income} tone="good" />
        <Stat label="Biaya operasional kerja" value={s.ops} tone="bad" />
        <Stat label="Keuntungan bersih ShopeeFood" value={s.net} tone={s.net >= 0 ? 'good' : 'bad'} />
        <Stat label="Pengeluaran pribadi" value={s.personal} tone="bad" />
      </div>
      <Stat label="Sisa setelah semua kebutuhan" value={s.left} tone={s.left >= 0 ? 'good' : 'bad'} sub="Untung bersih − pengeluaran pribadi" />

      <SectionTitle>Pendapatan harian</SectionTitle>
      <Card className="!px-2"><div className="h-52"><ResponsiveContainer><BarChart data={daily}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" /><XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 10 }} tickFormatter={compact} width={36} />
        <Tooltip formatter={(v: number) => idr(v)} /><Bar dataKey="Pendapatan" fill="#1f6b47" radius={[4, 4, 0, 0]} /><Bar dataKey="Untung bersih" fill="#9cc7ad" radius={[4, 4, 0, 0]} />
      </BarChart></ResponsiveContainer></div></Card>

      <SectionTitle>Pengeluaran per kategori</SectionTitle>
      <Card className="space-y-2.5">
        {byCat.length === 0 && <p className="text-sm text-stone-500">Belum ada pengeluaran pada periode ini.</p>}
        {byCat.map((c) => (
          <div key={c.name}>
            <div className="flex justify-between text-xs"><span>{c.name} <span className="text-stone-400">({c.ops ? 'kerja' : 'pribadi'})</span></span><b>{idr(c.v)}</b></div>
            <div className="mt-1 h-1.5 rounded-full bg-stone-100"><div className={`h-full rounded-full ${c.ops ? 'bg-brand-600' : 'bg-amber-500'}`} style={{ width: `${(c.v / maxCat) * 100}%` }} /></div>
          </div>
        ))}
      </Card>

      <SectionTitle>Saldo akun</SectionTitle>
      <Card className="divide-y divide-stone-100 !py-1">
        {accounts.map((a) => <div key={a.id} className="flex justify-between py-2.5 text-sm"><span>{a.name}</span><b className="tabular-nums">{idr(st[a.id]?.balance ?? 0)}</b></div>)}
      </Card>

      <SectionTitle>Perkembangan tabungan & dana darurat</SectionTitle>
      <Card className="!px-2"><div className="h-52"><ResponsiveContainer><LineChart data={growth}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" /><XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 10 }} tickFormatter={compact} width={36} />
        <Tooltip formatter={(v: number) => idr(v)} /><Line type="monotone" dataKey="Tabungan" stroke="#1f6b47" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="Dana darurat" stroke="#d97706" strokeWidth={2} dot={false} />
      </LineChart></ResponsiveContainer></div></Card>
    </div>
  )
}
