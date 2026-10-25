import { Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useData } from '../data'
import { fuelPerDay, kindMap, summarize, workDaysInMonth } from '../lib/calc'
import { idr, monthEnd, monthStart, todayStr, weekStart, addDays } from '../lib/format'
import { Btn, Card, Empty, SectionTitle, Stat } from '../components/ui'
import TxRow from '../components/TxRow'

export default function Narik() {
  const { txs, categories, settings, openEditor } = useData()
  const kind = useMemo(() => kindMap(categories), [categories])
  const t = todayStr()
  const day = summarize(txs, kind, t, t)
  const wk = summarize(txs, kind, weekStart(t), addDays(weekStart(t), 6))
  const mo = summarize(txs, kind, monthStart(t), monthEnd(t))
  const list = txs.filter((x) => x.source === 'narik').slice(0, 30)
  const daily = fuelPerDay(settings)
  const wdMonth = workDaysInMonth(t, settings.work_days)

  return (
    <div className="space-y-3">
      <Btn className="flex w-full items-center justify-center gap-2" onClick={() => openEditor({ mode: 'narik' })}><Plus size={16} /> Catat pendapatan narik</Btn>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Kotor hari ini" value={day.income} tone="good" />
        <Stat label="Kotor minggu ini" value={wk.income} tone="good" />
        <Stat label="Kotor bulan ini" value={mo.income} tone="good" />
        <Stat label="Biaya kerja bulan ini" value={mo.ops} tone="bad" />
      </div>
      <Stat label="Keuntungan bersih pekerjaan bulan ini" value={mo.net} tone={mo.net >= 0 ? 'good' : 'bad'} sub="Pendapatan ShopeeFood − biaya operasional. Pengeluaran pribadi tidak dikurangkan." />

      <SectionTitle>Kalkulator bensin</SectionTitle>
      <Card className="space-y-1 text-sm">
        <div className="text-xs text-stone-500">{settings.vehicle} · {settings.daily_km} km/hari · {settings.km_per_liter} km/liter · {idr(settings.fuel_price)}/liter</div>
        <div className="flex justify-between"><span>Estimasi per hari</span><b>{idr(daily)}</b></div>
        <div className="flex justify-between"><span>Per minggu ({settings.work_days.length} hari kerja)</span><b>{idr(daily * settings.work_days.length)}</b></div>
        <div className="flex justify-between"><span>Bulan ini ({wdMonth} hari kerja)</span><b>{idr(daily * wdMonth)}</b></div>
        <p className="pt-1 text-[11px] text-stone-500">Estimasi tidak masuk laporan. Catat pembelian bensin sebenarnya lewat Pengeluaran; pada hari itu estimasi otomatis tidak dipakai lagi.</p>
      </Card>

      <SectionTitle>Riwayat narik</SectionTitle>
      {list.length === 0 ? <Empty>Belum ada catatan narik.</Empty> : <Card className="divide-y divide-stone-100 !py-1">{list.map((x) => <TxRow key={x.id} tx={x} />)}</Card>}
    </div>
  )
}
