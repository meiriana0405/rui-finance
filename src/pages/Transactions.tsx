import { useState } from 'react'
import { useData } from '../data'
import { periodRange, PERIODS } from '../lib/calc'
import { idr } from '../lib/format'
import { Card, Empty, inputCls } from '../components/ui'
import TxRow from '../components/TxRow'

export default function Transactions() {
  const { txs, accounts, categories } = useData()
  const [period, setPeriod] = useState('month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [acc, setAcc] = useState('')
  const [cat, setCat] = useState('')
  const [type, setType] = useState('')
  const [f, t] = periodRange(period, from, to)
  const list = txs.filter(
    (x) => x.date >= f && x.date <= t && (!acc || x.account_id === acc || x.to_account_id === acc) && (!cat || x.category_id === cat) && (!type || x.type === type),
  )
  const inc = list.filter((x) => x.type === 'income').reduce((s, x) => s + x.amount, 0)
  const out = list.filter((x) => x.type === 'expense').reduce((s, x) => s + x.amount, 0)

  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select className={inputCls} value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIODS.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}</select>
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Semua jenis</option><option value="income">Pendapatan</option><option value="expense">Pengeluaran</option><option value="transfer">Transfer</option>
          </select>
          {period === 'range' && (<><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /><input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></>)}
          <select className={inputCls} value={acc} onChange={(e) => setAcc(e.target.value)}><option value="">Semua akun</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Semua kategori</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
        <div className="flex justify-between text-xs text-stone-600">
          <span>Masuk <b className="text-brand-700">{idr(inc)}</b></span><span>Keluar <b className="text-red-600">{idr(out)}</b></span><span>{list.length} transaksi</span>
        </div>
      </Card>
      {list.length === 0 ? <Empty>Belum ada transaksi pada filter ini. Tekan tombol + untuk menambah.</Empty> : (
        <Card className="divide-y divide-stone-100 !py-1">{list.map((x) => <TxRow key={x.id} tx={x} />)}</Card>
      )}
    </div>
  )
}
