import { useEffect, useState } from 'react'
import { ArrowLeftRight, BarChart3, Bike, LayoutDashboard, Plus, Settings as Cog, Wallet as WalletIcon } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { DataProvider, useData } from './data'
import EditorHost from './components/Editor'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Narik from './pages/Narik'
import Wallet from './pages/Wallet'
import Reports from './pages/Reports'
import SettingsPage from './pages/SettingsPage'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: Dashboard },
  { id: 'transaksi', label: 'Transaksi', icon: ArrowLeftRight, page: Transactions },
  { id: 'narik', label: 'Narik', icon: Bike, page: Narik },
  { id: 'dompet', label: 'Dompet', icon: WalletIcon, page: Wallet },
  { id: 'laporan', label: 'Laporan', icon: BarChart3, page: Reports },
  { id: 'setelan', label: 'Pengaturan', icon: Cog, page: SettingsPage },
]

function Shell() {
  const [tab, setTab] = useState('dashboard')
  const [menu, setMenu] = useState(false)
  const { openEditor } = useData()
  const current = TABS.find((t) => t.id === tab)!
  const Page = current.page
  const add = (mode: 'expense' | 'transfer' | 'narik') => { setMenu(false); openEditor({ mode }) }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-stone-100">
      <header className="sticky top-0 z-30 bg-stone-100/95 px-4 pb-2 pt-4 backdrop-blur">
        <h1 className="text-lg font-extrabold text-brand-900">{current.id === 'dashboard' ? 'Rui Finance' : current.label}</h1>
      </header>
      <main className="px-4 pb-36"><Page /></main>

      {menu && <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2" style={{ right: 'max(1rem, calc(50vw - 14rem + 1rem))' }}>
        {menu && (
          <div className="flex flex-col gap-2">
            <button onClick={() => add('narik')} className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-lg">Pendapatan narik</button>
            <button onClick={() => add('expense')} className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-lg">Pengeluaran</button>
            <button onClick={() => add('transfer')} className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-lg">Transfer</button>
          </div>
        )}
        <button onClick={() => setMenu(!menu)} aria-label="Tambah transaksi" className="grid h-14 w-14 place-items-center rounded-full bg-brand-800 text-white shadow-xl">
          <Plus size={26} className={menu ? 'rotate-45 transition' : 'transition'} />
        </button>
      </div>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-md">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${tab === t.id ? 'text-brand-800' : 'text-stone-400'}`}>
              <t.icon size={20} />{t.label}
            </button>
          ))}
        </div>
      </nav>
      <EditorHost />
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  if (!ready) return <div className="grid h-screen place-items-center text-sm text-stone-500">Memuat...</div>
  if (!session) return <Login />
  return <DataProvider key={session.user.id}><Shell /></DataProvider>
}
