import { useMemo, useState } from 'react'
import { ArrowLeftRight, ChevronDown, Pencil, Plus } from 'lucide-react'
import { useData } from '../data'
import { allocSum, balances, POS } from '../lib/calc'
import { idr, todayStr } from '../lib/format'
import { supabase } from '../lib/supabase'
import { Account, PosKey } from '../lib/types'
import { Btn, Card, Field, inputCls, MoneyInput, SectionTitle, Sheet } from '../components/ui'
import TxRow from '../components/TxRow'

function AccountForm({ acc, onDone }: { acc?: Account; onDone: () => void }) {
  const { accounts, txs, refresh } = useData()
  const [name, setName] = useState(acc?.name ?? '')
  const [init, setInit] = useState(acc?.initial_balance ?? 0)
  const [purpose, setPurpose] = useState(acc?.purpose ?? '')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const save = async () => {
    if (busy) return
    if (!name.trim()) return setErr('Nama akun wajib diisi.')
    setBusy(true)
    const row = { name: name.trim(), initial_balance: init, purpose: purpose.trim() || null }
    const r = acc ? await supabase.from('accounts').update(row).eq('id', acc.id) : await supabase.from('accounts').insert({ ...row, sort: accounts.length + 1 })
    setBusy(false)
    if (r.error) return setErr(r.error.message)
    await refresh(); onDone()
  }
  const remove = async () => {
    if (!acc) return
    if (txs.some((t) => t.account_id === acc.id || t.to_account_id === acc.id)) return setErr('Akun masih punya transaksi, tidak bisa dihapus.')
    if (!confirm(`Hapus akun ${acc.name}?`)) return
    const r = await supabase.from('accounts').delete().eq('id', acc.id)
    if (r.error) return setErr(r.error.message)
    await refresh(); onDone()
  }
  return (
    <div className="space-y-3">
      <Field label="Nama akun"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Saldo awal"><MoneyInput value={init} onChange={setInit} /></Field>
      <Field label="Fungsi akun"><input className={inputCls} value={purpose} onChange={(e) => setPurpose(e.target.value)} /></Field>
      {err && <p className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700">{err}</p>}
      <Btn className="w-full" disabled={busy} onClick={save}>Simpan akun</Btn>
      {acc && <Btn variant="danger" className="w-full" onClick={remove}>Hapus akun</Btn>}
    </div>
  )
}

function AdjustForm({ pos, onDone }: { pos: PosKey; onDone: () => void }) {
  const { refresh } = useData()
  const [mode, setMode] = useState<1 | -1>(1)
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayStr())
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const save = async () => {
    if (busy) return
    if (amount <= 0) return setErr('Nominal harus lebih dari 0.')
    setBusy(true)
    const r = await supabase.from('allocations').insert({ pos, date, amount: amount * mode, note: note.trim() || null })
    setBusy(false)
    if (r.error) return setErr(r.error.message)
    await refresh(); onDone()
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Btn variant={mode === 1 ? 'primary' : 'ghost'} onClick={() => setMode(1)}>Tambah</Btn>
        <Btn variant={mode === -1 ? 'primary' : 'ghost'} onClick={() => setMode(-1)}>Kurangi</Btn>
      </div>
      <Field label="Nominal"><MoneyInput value={amount} onChange={setAmount} /></Field>
      <Field label="Tanggal"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Catatan"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <p className="text-[11px] text-stone-500">Ini hanya mengubah catatan alokasi, bukan saldo rekening. Pindahkan uang sungguhan lewat Transfer.</p>
      {err && <p className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700">{err}</p>}
      <Btn className="w-full" disabled={busy} onClick={save}>Simpan penyesuaian</Btn>
    </div>
  )
}

export default function Wallet() {
  const { accounts, txs, allocs, settings, openEditor } = useData()
  const st = useMemo(() => balances(accounts, txs), [accounts, txs])
  const [edit, setEdit] = useState<Account | 'new' | null>(null)
  const [open, setOpen] = useState('')
  const [adjust, setAdjust] = useState<PosKey | null>(null)
  const sea = accounts.find((a) => a.name === 'SeaBank')
  const seaAlloc = allocSum(allocs, 'tabungan') + allocSum(allocs, 'motor')
  const goals: { key: 'tabungan' | 'darurat' | 'motor'; label: string; where: string }[] = [
    { key: 'tabungan', label: 'Tabungan utama', where: 'SeaBank' },
    { key: 'darurat', label: 'Dana darurat', where: 'DANA' },
    { key: 'motor', label: 'Perawatan motor', where: 'SeaBank' },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Btn className="flex items-center justify-center gap-2" onClick={() => openEditor({ mode: 'transfer' })}><ArrowLeftRight size={16} /> Transfer</Btn>
        <Btn variant="ghost" className="flex items-center justify-center gap-2" onClick={() => setEdit('new')}><Plus size={16} /> Akun baru</Btn>
      </div>

      {accounts.map((a) => {
        const s = st[a.id]
        const hist = txs.filter((t) => t.account_id === a.id || t.to_account_id === a.id).slice(0, 10)
        return (
          <Card key={a.id}>
            <div className="flex items-start justify-between">
              <div><div className="font-bold">{a.name}</div><div className="text-xs text-stone-500">{a.purpose}</div></div>
              <button onClick={() => setEdit(a)} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Ubah akun"><Pencil size={15} /></button>
            </div>
            <div className="mt-1 text-2xl font-extrabold tabular-nums text-brand-800">{idr(s?.balance ?? 0)}</div>
            <div className="mt-1 grid grid-cols-2 gap-x-3 text-xs text-stone-600">
              <span>Saldo awal {idr(a.initial_balance)}</span><span>Pemasukan {idr(s?.income ?? 0)}</span>
              <span>Pengeluaran {idr(s?.expense ?? 0)}</span><span>Transfer +{idr(s?.transferIn ?? 0)} / −{idr(s?.transferOut ?? 0)}</span>
            </div>
            <button className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand-700" onClick={() => setOpen(open === a.id ? '' : a.id)}>
              Riwayat <ChevronDown size={14} className={open === a.id ? 'rotate-180' : ''} />
            </button>
            {open === a.id && (hist.length ? <div className="divide-y divide-stone-100">{hist.map((t) => <TxRow key={t.id} tx={t} />)}</div> : <p className="py-2 text-xs text-stone-500">Belum ada transaksi.</p>)}
          </Card>
        )
      })}

      <SectionTitle>Tujuan keuangan</SectionTitle>
      {sea && seaAlloc > (st[sea.id]?.balance ?? 0) && (
        <p className="rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800">Alokasi tabungan + perawatan motor ({idr(seaAlloc)}) lebih besar dari saldo SeaBank. Cek apakah uangnya sudah ditransfer.</p>
      )}
      {goals.map((g) => {
        const v = allocSum(allocs, g.key)
        const target = settings.targets[g.key]
        const pct = target > 0 ? Math.min(100, Math.round((v / target) * 100)) : 0
        return (
          <Card key={g.key}>
            <div className="flex items-center justify-between">
              <div><div className="font-bold">{g.label}</div><div className="text-xs text-stone-500">Disimpan di {g.where}</div></div>
              <Btn variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => setAdjust(g.key)}>Sesuaikan</Btn>
            </div>
            <div className="mt-1 text-xl font-extrabold tabular-nums">{idr(v)}</div>
            {target > 0 ? (
              <><div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full bg-brand-600" style={{ width: `${pct}%` }} /></div>
              <div className="mt-1 text-xs text-stone-500">{pct}% dari target {idr(target)}</div></>
            ) : <div className="mt-1 text-xs text-stone-500">Target belum ditentukan (atur di Pengaturan).</div>}
            {g.key === 'tabungan' && (
              <div className="mt-2 flex gap-1.5">{[100000, 500000, 1000000].map((m) => <span key={m} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${v >= m ? 'bg-brand-700 text-white' : 'bg-stone-100 text-stone-500'}`}>{idr(m)}</span>)}</div>
            )}
          </Card>
        )
      })}
      <p className="text-[11px] text-stone-500">Alokasi adalah catatan virtual, bukan uang tambahan di atas saldo rekening. Aplikasi ini tidak terhubung ke bank atau e-wallet; semua pencatatan manual.</p>
      <p className="text-[11px] text-stone-500">Pos uang jajan ({idr(allocSum(allocs, 'jajan'))}) dan kebutuhan harian ({idr(allocSum(allocs, 'harian'))}) juga tercatat sebagai alokasi.</p>

      {edit && <Sheet title={edit === 'new' ? 'Akun baru' : 'Ubah akun'} onClose={() => setEdit(null)}><AccountForm acc={edit === 'new' ? undefined : edit} onDone={() => setEdit(null)} /></Sheet>}
      {adjust && <Sheet title={`Sesuaikan ${POS.find((p) => p.key === adjust)?.label}`} onClose={() => setAdjust(null)}><AdjustForm pos={adjust} onDone={() => setAdjust(null)} /></Sheet>}
    </div>
  )
}
