import { useState } from 'react'
import { useData } from '../data'
import { fuelPerDay, POS } from '../lib/calc'
import { idr } from '../lib/format'
import { supabase } from '../lib/supabase'
import { Category, PosKey, Settings } from '../lib/types'
import { Btn, Card, Field, inputCls, MoneyInput, SectionTitle } from '../components/ui'

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function CategoryRow({ c }: { c: Category }) {
  const { txs, refresh } = useData()
  const [name, setName] = useState(c.name)
  const rename = async () => {
    if (!name.trim() || name.trim() === c.name) return setName(c.name)
    const r = await supabase.from('categories').update({ name: name.trim() }).eq('id', c.id)
    if (r.error) alert(r.error.message)
    await refresh()
  }
  const remove = async () => {
    if (txs.some((t) => t.category_id === c.id)) return alert('Kategori masih dipakai transaksi.')
    if (!confirm(`Hapus kategori ${c.name}?`)) return
    const r = await supabase.from('categories').delete().eq('id', c.id)
    if (r.error) alert(r.error.message)
    await refresh()
  }
  return (
    <div className="flex gap-2">
      <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} onBlur={rename} />
      <Btn variant="danger" className="!px-3" onClick={remove}>Hapus</Btn>
    </div>
  )
}

export default function SettingsPage() {
  const { settings, categories, refresh } = useData()
  const [s, setS] = useState<Settings>(settings)
  const [newName, setNewName] = useState('')
  const [newKind, setNewKind] = useState<'operasional' | 'pribadi'>('pribadi')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const pctTotal = POS.reduce((x, p) => x + (s.alloc_pct[p.key] || 0), 0)

  const save = async () => {
    if (busy) return
    if (pctTotal !== 100) return setMsg('Total persentase alokasi harus 100%.')
    if (s.km_per_liter <= 0 || s.fuel_price <= 0) return setMsg('Konsumsi BBM dan harga bensin harus lebih dari 0.')
    setBusy(true)
    const { user_id, ...row } = s
    const r = await supabase.from('settings').update(row).eq('user_id', user_id)
    setBusy(false)
    setMsg(r.error ? r.error.message : 'Pengaturan disimpan.')
    if (!r.error) await refresh()
  }
  const addCat = async () => {
    if (!newName.trim()) return
    const r = await supabase.from('categories').insert({ name: newName.trim(), kind: newKind, sort: categories.length + 1 })
    if (r.error) return alert(r.error.message)
    setNewName(''); await refresh()
  }
  const num = (k: 'daily_km' | 'km_per_liter') => (
    <input inputMode="decimal" className={inputCls} value={s[k]} onChange={(e) => setS({ ...s, [k]: Number(e.target.value.replace(',', '.')) || 0 })} />
  )

  return (
    <div className="space-y-3">
      <SectionTitle>Kalkulator bensin</SectionTitle>
      <Card className="space-y-3">
        <Field label="Kendaraan"><input className={inputCls} value={s.vehicle} onChange={(e) => setS({ ...s, vehicle: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Jarak harian (km)">{num('daily_km')}</Field>
          <Field label="Konsumsi (km/liter)">{num('km_per_liter')}</Field>
        </div>
        <Field label="Harga bensin per liter"><MoneyInput value={s.fuel_price} onChange={(v) => setS({ ...s, fuel_price: v })} /></Field>
        <div>
          <div className="mb-1 text-xs font-semibold text-stone-600">Hari kerja</div>
          <div className="flex gap-1.5">{DAYS.map((d, i) => {
            const on = s.work_days.includes(i)
            return <button key={d} onClick={() => setS({ ...s, work_days: on ? s.work_days.filter((x) => x !== i) : [...s.work_days, i] })} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${on ? 'bg-brand-800 text-white' : 'bg-stone-100 text-stone-500'}`}>{d}</button>
          })}</div>
        </div>
        <p className="text-xs text-stone-500">Estimasi: {idr(fuelPerDay(s))} per hari.</p>
      </Card>

      <SectionTitle>Pembagian uang</SectionTitle>
      <Card className="space-y-2">
        {POS.map((p) => (
          <div key={p.key} className="grid grid-cols-[1fr_90px] items-center gap-2 text-sm">
            <span>{p.label}</span>
            <div className="relative"><input inputMode="numeric" className={`${inputCls} pr-7 text-right`} value={s.alloc_pct[p.key]} onChange={(e) => setS({ ...s, alloc_pct: { ...s.alloc_pct, [p.key as PosKey]: Number(e.target.value.replace(/\D/g, '')) || 0 } })} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">%</span></div>
          </div>
        ))}
        <div className={`text-right text-xs font-semibold ${pctTotal === 100 ? 'text-brand-700' : 'text-red-600'}`}>Total {pctTotal}%</div>
      </Card>

      <SectionTitle>Target tujuan</SectionTitle>
      <Card className="space-y-3">
        {(['tabungan', 'darurat', 'motor'] as const).map((k) => (
          <Field key={k} label={{ tabungan: 'Tabungan utama', darurat: 'Dana darurat', motor: 'Perawatan motor' }[k]} hint={k !== 'tabungan' ? 'Kosongkan jika belum ditentukan.' : undefined}>
            <MoneyInput value={s.targets[k]} onChange={(v) => setS({ ...s, targets: { ...s.targets, [k]: v } })} />
          </Field>
        ))}
      </Card>

      {msg && <p className="rounded-xl bg-brand-50 p-2.5 text-xs text-brand-800">{msg}</p>}
      <Btn className="w-full" disabled={busy} onClick={save}>Simpan pengaturan</Btn>

      <SectionTitle>Kategori</SectionTitle>
      <Card className="space-y-2">
        {(['operasional', 'pribadi'] as const).map((k) => (
          <div key={k} className="space-y-2">
            <div className="text-xs font-semibold text-stone-600">{k === 'operasional' ? 'Biaya kerja' : 'Pengeluaran pribadi'}</div>
            {categories.filter((c) => c.kind === k).map((c) => <CategoryRow key={c.id} c={c} />)}
          </div>
        ))}
        <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-stone-100 pt-3">
          <input className={inputCls} placeholder="Nama kategori baru" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <select className={inputCls} value={newKind} onChange={(e) => setNewKind(e.target.value as 'operasional' | 'pribadi')}><option value="pribadi">Pribadi</option><option value="operasional">Kerja</option></select>
        </div>
        <Btn variant="ghost" className="w-full" onClick={addCat}>Tambah kategori</Btn>
      </Card>

      <Btn variant="danger" className="w-full" onClick={() => supabase.auth.signOut()}>Keluar</Btn>
    </div>
  )
}
