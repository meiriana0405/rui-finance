import { useState } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'
import { Btn, Field, inputCls } from '../components/ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signup, setSignup] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (busy) return
    setBusy(true); setMsg('')
    const r = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (r.error) return setMsg(r.error.message)
    if (signup && !r.data.session) setMsg('Akun dibuat. Cek email untuk konfirmasi, lalu masuk.')
  }

  return (
    <div className="grid min-h-screen place-items-center bg-brand-900 p-5">
      <div className="w-full max-w-sm space-y-3 rounded-3xl bg-white p-6">
        <div><h1 className="text-2xl font-extrabold text-brand-900">Rui Finance</h1><p className="text-sm text-stone-500">Catatan keuangan harian driver ShopeeFood.</p></div>
        {!supabaseReady && <p className="rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800">Variabel VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diisi (lihat .env.example).</p>}
        <Field label="Email"><input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
        <Field label="Kata sandi aplikasi" hint="Bukan PIN atau password bank."><input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? 'new-password' : 'current-password'} onKeyDown={(e) => e.key === 'Enter' && submit()} /></Field>
        {msg && <p className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700">{msg}</p>}
        <Btn className="w-full" disabled={busy || !email || password.length < 6} onClick={submit}>{signup ? 'Buat akun' : 'Masuk'}</Btn>
        <button className="w-full text-center text-xs font-semibold text-brand-700" onClick={() => setSignup(!signup)}>{signup ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}</button>
      </div>
    </div>
  )
}
