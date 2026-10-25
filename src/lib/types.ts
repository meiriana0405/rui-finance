export type PosKey = 'harian' | 'tabungan' | 'motor' | 'jajan' | 'darurat'
export type Account = { id: string; name: string; initial_balance: number; purpose: string | null; sort: number }
export type Category = { id: string; name: string; kind: 'operasional' | 'pribadi'; sort: number }
export type Tx = {
  id: string; date: string; type: 'income' | 'expense' | 'transfer'; source: string | null
  amount: number; account_id: string; to_account_id: string | null; category_id: string | null
  note: string | null; base_income: number | null; bonus: number | null; tips: number | null
  orders: number | null; created_at: string
}
export type Alloc = { id: string; tx_id: string | null; date: string; pos: PosKey; amount: number; note: string | null }
export type Settings = {
  user_id: string; vehicle: string; daily_km: number; km_per_liter: number; fuel_price: number
  work_days: number[]; alloc_pct: Record<PosKey, number>
  targets: { tabungan: number; darurat: number; motor: number }
}
export type Mode = 'expense' | 'transfer' | 'narik'
