import { useEffect, useMemo, useRef, useState } from 'react'
import { useData } from '../data'
import { supabase } from '../lib/supabase'
import { balances, fuelPerDay, kindMap, POS, splitAlloc } from '../lib/calc'
import { idr, todayStr } from '../lib/format'
import { Alloc, PosKey, Tx } from '../lib/types'
import { Btn, Card, Field, inputCls, MoneyInput } from './ui'

function useSubmit() {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const lock = useRef(false) // cegah kirim ganda
  const run = async (fn: () => Promise<void>) => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setErr('')
    try { await fn() } catch (e: any) { setErr(e?.message ?? String(e)) } finally { lock.current = false; setBusy(false) }
  }
  return { busy, err, run }
}

const SubmitBar = ({ busy, err, onClick, label }: { busy: boolean; err: string; onClick: () => void; label: string }) => (
  <div className="space-y-2 pt-1">
    {err && <p className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700">{err}</p>}
    <Btn className="w-full" disabled={busy} onClick={onClick}>{busy ? 'Menyimpan...' : label}</Btn>
  </div>
)

const must = (r: { error: { message: string } | null }) => { if (r.error) throw new Error(r.error.message) }

export function ExpenseForm({ tx, onDone }: { tx?: Tx; onDone: () => void }) {
  const { accounts, categories, refresh } = useData()
  const [date, setDate] = useState(tx?.date ?? todayStr())
  const [amount, setAmount] = useState(tx?.amount ?? 0)
  const [cat, setCat] = useState(tx?.category_id ?? '')
  const [acc, setAcc] = useState(tx?.account_id ?? accounts[0]?.id ?? '')
  const [note, setNote] = useState(tx?.note ?? '')
  const { busy, err, run } = useSubmit()

  const save = () => run(async () => {
    if (amount <= 0) throw new Error('Nominal harus lebih dari 0.')
    if (!cat) throw new Error('Pilih kategori.')
    if (!acc) throw new Error('Pilih akun.')
    const row = { type: 'expense', date, amount, category_id: cat, account_id: acc, note: note.trim() || null }
    must(tx ? await supabase.from('transactions').update(row).eq('id', tx.id) : await supabase.from('transactions').insert(row))
    await refresh()
    onDone()
  })

  return (
    <div className="space-y-3">
      <Field label="Tanggal"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Nominal"><MoneyInput value={amount} onChange={setAmount} /></Field>
      <Field label="Kategori">
        <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Pilih kategori</option>
          <optgroup label="Biaya kerja">{categories.filter((c) => c.kind === 'operasional').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
          <optgroup label="Pengeluaran pribadi">{categories.filter((c) => c.kind === 'pribadi').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
        </select>
      </Field>
      <Field label="Akun yang digunakan">
        <select className={inputCls} value={acc} onChange={(e) => setAcc(e.target.value)}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
      </Field>
      <Field label="Catatan (opsional)"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <SubmitBar busy={busy} err={err} onClick={save} label={tx ? 'Simpan perubahan' : 'Simpan pengeluaran'} />
    </div>
  )
}

export function TransferForm({ tx, onDone }: { tx?: Tx; onDone: () => void }) {
  const { accounts, categories, txs, refresh } = useData()
  const [from, setFrom] = useState(tx?.account_id ?? accounts[0]?.id ?? '')
  const [to, setTo] = useState(tx?.to_account_id ?? accounts[1]?.id ?? '')
  const [amount, setAmount] = useState(tx?.amount ?? 0)
  const [fee, setFee] = useState(0)
  const [date, setDate] = useState(tx?.date ?? todayStr())
  const [note, setNote] = useState(tx?.note ?? '')
  const { busy, err, run } = useSubmit()
  const stats = useMemo(() => balances(accounts, txs.filter((t) => t.id !== tx?.id)), [accounts, txs, tx])

  const save = () => run(async () => {
    if (amount <= 0) throw new Error('Nominal harus lebih dari 0.')
    if (from === to) throw new Error('Akun asal dan tujuan tidak boleh sama.')
    if (amount + (tx ? 0 : fee) > (stats[from]?.balance ?? 0)) throw new Error('Saldo akun asal tidak mencukupi.')
    const row = { type: 'transfer', date, amount, account_id: from, to_account_id: to, note: note.trim() || null }
    if (tx) must(await supabase.from('transactions').update(row).eq('id', tx.id))
    else {
      const rows: object[] = [row]
      if (fee > 0) {
        const c = categories.find((x) => x.name === 'Lain-lain') ?? categories.find((x) => x.kind === 'pribadi')
        rows.push({ type: 'expense', date, amount: fee, account_id: from, category_id: c?.id ?? null, note: 'Biaya transfer' })
      }
      must(await supabase.from('transactions').insert(rows))
    }
    await refresh()
    onDone()
  })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Dari" hint={`Saldo ${idr(stats[from]?.balance ?? 0)}`}>
          <select className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        </Field>
        <Field label="Ke">
          <select className={inputCls} value={to} onChange={(e) => setTo(e.target.value)}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        </Field>
      </div>
      <Field label="Nominal"><MoneyInput value={amount} onChange={setAmount} /></Field>
      {!tx && <Field label="Biaya transfer (opsional)" hint="Dicatat sebagai pengeluaran terpisah."><MoneyInput value={fee} onChange={setFee} /></Field>}
      <Field label="Tanggal"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Catatan"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <SubmitBar busy={busy} err={err} onClick={save} label={tx ? 'Simpan perubahan' : 'Transfer'} />
    </div>
  )
}

export function NarikForm({ tx, onDone }: { tx?: Tx; onDone: () => void }) {
  const { accounts, categories, txs, allocs, settings, refresh } = useData()
  const [date, setDate] = useState(tx?.date ?? todayStr())
  const [base, setBase] = useState(tx?.base_income ?? tx?.amount ?? 0)
  const [bonus, setBonus] = useState(tx?.bonus ?? 0)
  const [tips, setTips] = useState(tx?.tips ?? 0)
  const [orders, setOrders] = useState(tx?.orders ? String(tx.orders) : '')
  const [note, setNote] = useState(tx?.note ?? '')
  const [acc, setAcc] = useState(tx?.account_id ?? accounts.find((a) => a.name === 'BCA')?.id ?? accounts[0]?.id ?? '')
  const existing = useMemo(() => (tx ? allocs.filter((a) => a.tx_id === tx.id) : []), [allocs, tx])
  const [useAlloc, setUseAlloc] = useState(tx ? existing.length > 0 : true)
  const [manual, setManual] = useState(existing.length > 0)
  const [alloc, setAlloc] = useState<Record<PosKey, number>>(() => {
    const o = { harian: 0, tabungan: 0, motor: 0, jajan: 0, darurat: 0 } as Record<PosKey, number>
    existing.forEach((a) => (o[a.pos] += a.amount))
    return o
  })
  const { busy, err, run } = useSubmit()

  // Biaya kerja hari itu: pengeluaran aktual; bila bensin belum dicatat, pakai estimasi (tidak dihitung ganda).
  const kind = useMemo(() => kindMap(categories), [categories])
  const dayExp = txs.filter((t) => t.type === 'expense' && t.date === date)
  const opsActual = dayExp.filter((t) => t.category_id && kind.get(t.category_id) === 'operasional').reduce((s, t) => s + t.amount, 0)
  const fuelLogged = dayExp.some((t) => categories.find((c) => c.id === t.category_id)?.name === 'Bensin')
  const fuelEst = fuelLogged ? 0 : fuelPerDay(settings)
  const gross = base + bonus + tips
  const available = Math.max(0, gross - opsActual - fuelEst)
  const pctKey = JSON.stringify(settings.alloc_pct)

  useEffect(() => { if (!manual) setAlloc(splitAlloc(available, settings.alloc_pct)) }, [available, manual, pctKey]) // eslint-disable-line
  const allocTotal = Object.values(alloc).reduce((s, v) => s + v, 0)

  const save = () => run(async () => {
    if (gross <= 0) throw new Error('Isi pendapatan ShopeeFood terlebih dahulu.')
    if (!acc) throw new Error('Pilih akun tujuan.')
    if (useAlloc && allocTotal > available) throw new Error('Total alokasi melebihi uang yang tersedia.')
    const row = {
      type: 'income', source: 'narik', date, amount: gross, account_id: acc, base_income: base, bonus, tips,
      orders: orders ? Number(orders) : null, note: note.trim() || null,
    }
    let id = tx?.id
    if (tx) must(await supabase.from('transactions').update(row).eq('id', tx.id))
    else {
      const r = await supabase.from('transactions').insert(row).select('id').single()
      must(r)
      id = r.data!.id
    }
    must(await supabase.from('allocations').delete().eq('tx_id', id!))
    const rows = useAlloc ? POS.filter((p) => alloc[p.key] > 0).map((p) => ({ tx_id: id, date, pos: p.key, amount: alloc[p.key] })) : []
    if (rows.length) must(await supabase.from('allocations').insert(rows))
    await refresh()
    onDone()
  })

  return (
    <div className="space-y-3">
      <Field label="Tanggal"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Pendapatan ShopeeFood"><MoneyInput value={base} onChange={setBase} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Bonus / insentif"><MoneyInput value={bonus} onChange={setBonus} /></Field>
        <Field label="Tips pelanggan"><MoneyInput value={tips} onChange={setTips} /></Field>
      </div>
      <p className="-mt-1 text-xs text-stone-500">Isi bonus dan tips hanya jika belum termasuk di pendapatan di atas.</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Jumlah pesanan (opsional)"><input inputMode="numeric" className={inputCls} value={orders} onChange={(e) => setOrders(e.target.value.replace(/\D/g, ''))} /></Field>
        <Field label="Uang masuk ke">
          <select className={inputCls} value={acc} onChange={(e) => setAcc(e.target.value)}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        </Field>
      </div>
      <Field label="Catatan"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>

      <Card className="space-y-2 !bg-brand-50 !border-brand-100">
        <div className="flex justify-between text-sm"><span>Pendapatan kotor</span><b>{idr(gross)}</b></div>
        <div className="flex justify-between text-sm"><span>Biaya kerja tercatat</span><span>- {idr(opsActual)}</span></div>
        {!fuelLogged && <div className="flex justify-between text-sm"><span>Estimasi bensin</span><span>- {idr(fuelEst)}</span></div>}
        <div className="flex justify-between border-t border-brand-200 pt-2 text-sm font-bold text-brand-800"><span>Tersedia dialokasikan</span><span>{idr(available)}</span></div>
      </Card>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={useAlloc} onChange={(e) => setUseAlloc(e.target.checked)} /> Catat alokasi virtual
      </label>
      {useAlloc && (
        <div className="space-y-2">
          {POS.map((p) => (
            <div key={p.key} className="grid grid-cols-[1fr_130px] items-center gap-2">
              <div className="text-sm">{p.label}<div className="text-[11px] text-stone-500">{settings.alloc_pct[p.key]}% · {p.where}</div></div>
              <MoneyInput value={alloc[p.key]} onChange={(v) => { setManual(true); setAlloc({ ...alloc, [p.key]: v }) }} />
            </div>
          ))}
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span>{allocTotal > available ? <b className="text-red-600">Melebihi {idr(allocTotal - available)}</b> : `Belum dialokasikan ${idr(available - allocTotal)}`}</span>
            <button className="font-semibold text-brand-700" onClick={() => setManual(false)}>Hitung ulang otomatis</button>
          </div>
          <p className="text-[11px] text-stone-500">Alokasi hanya catatan. Isi 0 untuk melewati pos saat penghasilan rendah. Uang tidak dipindahkan otomatis.</p>
        </div>
      )}
      <SubmitBar busy={busy} err={err} onClick={save} label={tx ? 'Simpan perubahan' : 'Simpan pendapatan'} />
    </div>
  )
}
