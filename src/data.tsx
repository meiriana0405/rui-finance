import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import { Account, Alloc, Category, Mode, Settings, Tx } from './lib/types'

type Editor = { mode: Mode; tx?: Tx } | null
type Ctx = {
  accounts: Account[]; categories: Category[]; txs: Tx[]; allocs: Alloc[]; settings: Settings
  refresh: () => Promise<void>
  editor: Editor; openEditor: (e: { mode?: Mode; tx?: Tx }) => void; closeEditor: () => void
  deleteTx: (t: Tx) => Promise<void>
}
const DataCtx = createContext<Ctx>(null as unknown as Ctx)
export const useData = () => useContext(DataCtx)

const SEED_ACCOUNTS = [
  { name: 'BCA', purpose: 'Uang operasional, bensin, dan kebutuhan harian', sort: 1 },
  { name: 'SeaBank', purpose: 'Tabungan utama dan perawatan motor', sort: 2 },
  { name: 'ShopeePay', purpose: 'Uang jajan', sort: 3 },
  { name: 'DANA', purpose: 'Dana darurat', sort: 4 },
]
const OPS = ['Bensin', 'Parkir', 'Makan dan minum saat bekerja', 'Servis motor', 'Oli', 'Ban dan suku cadang', 'Biaya kerja lainnya']
const PERSONAL = ['Makan pribadi', 'Pulsa dan internet', 'Kebutuhan kuliah', 'Kebutuhan rumah', 'Jajan', 'Hiburan', 'Kesehatan', 'Lain-lain']
const SEED_CATS = [
  ...OPS.map((name, i) => ({ name, kind: 'operasional', sort: i + 1 })),
  ...PERSONAL.map((name, i) => ({ name, kind: 'pribadi', sort: i + 1 })),
]

export function DataProvider({ children }: { children: ReactNode }) {
  const [d, setD] = useState<{ accounts: Account[]; categories: Category[]; txs: Tx[]; allocs: Alloc[]; settings: Settings | null }>({
    accounts: [], categories: [], txs: [], allocs: [], settings: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState<Editor>(null)
  const started = useRef(false)

  const load = useCallback(async (seeded = false): Promise<void> => {
    const [a, c, t, al, s] = await Promise.all([
      supabase.from('accounts').select('*').order('sort'),
      supabase.from('categories').select('*').order('sort'),
      supabase.from('transactions').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('allocations').select('*'),
      supabase.from('settings').select('*').maybeSingle(),
    ])
    const e = a.error || c.error || t.error || al.error || s.error
    if (e) { setError(e.message); setLoading(false); return }

    // Pertama kali login: isi data awal (4 akun, kategori, pengaturan).
    if (!s.data && !seeded) {
      const r1 = await supabase.from('settings').insert({})
      const r2 = await supabase.from('accounts').insert(SEED_ACCOUNTS)
      const r3 = await supabase.from('categories').insert(SEED_CATS)
      const e2 = r1.error || r2.error || r3.error
      if (e2) { setError(e2.message); setLoading(false); return }
      return load(true)
    }
    setD({
      accounts: a.data as Account[], categories: c.data as Category[], txs: t.data as Tx[],
      allocs: al.data as Alloc[], settings: s.data as Settings | null,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    if (started.current) return
    started.current = true
    load()
  }, [load])

  const refresh = useCallback(() => load(true), [load])

  const deleteTx = useCallback(async (t: Tx) => {
    if (!confirm('Hapus transaksi ini? Saldo dan laporan akan ikut diperbarui.')) return
    const { error } = await supabase.from('transactions').delete().eq('id', t.id)
    if (error) { alert('Gagal menghapus: ' + error.message); return }
    await load(true)
  }, [load])

  const openEditor = (e: { mode?: Mode; tx?: Tx }) => {
    const mode: Mode = e.mode ?? (e.tx?.source === 'narik' ? 'narik' : e.tx?.type === 'transfer' ? 'transfer' : 'expense')
    setEditor({ mode, tx: e.tx })
  }

  if (loading) return <div className="grid h-screen place-items-center text-sm text-stone-500">Memuat data...</div>
  if (error || !d.settings)
    return (
      <div className="mx-auto max-w-md p-6 text-sm">
        <p className="font-bold text-red-700">Gagal memuat data</p>
        <p className="mt-2 text-stone-600">{error || 'Pengaturan tidak ditemukan.'}</p>
        <p className="mt-2 text-stone-600">Pastikan file supabase/schema.sql sudah dijalankan di Supabase.</p>
      </div>
    )

  return (
    <DataCtx.Provider value={{ ...d, settings: d.settings, refresh, editor, openEditor, closeEditor: () => setEditor(null), deleteTx }}>
      {children}
    </DataCtx.Provider>
  )
}
