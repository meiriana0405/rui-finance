import { ArrowLeftRight, Bike, Pencil, Receipt, Trash2 } from 'lucide-react'
import { useData } from '../data'
import { idr, shortDate } from '../lib/format'
import { Tx } from '../lib/types'

export default function TxRow({ tx }: { tx: Tx }) {
  const { accounts, categories, openEditor, deleteTx } = useData()
  const acc = (id: string | null) => accounts.find((a) => a.id === id)?.name ?? '-'
  const isNarik = tx.source === 'narik'
  const title = tx.type === 'transfer' ? `${acc(tx.account_id)} → ${acc(tx.to_account_id)}` : isNarik ? 'Pendapatan Narik' : categories.find((c) => c.id === tx.category_id)?.name ?? 'Tanpa kategori'
  const Icon = tx.type === 'transfer' ? ArrowLeftRight : isNarik ? Bike : Receipt
  const color = tx.type === 'income' ? 'text-brand-700' : tx.type === 'expense' ? 'text-red-600' : 'text-stone-600'
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700"><Icon size={16} /></div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{title}</div>
        <div className="truncate text-xs text-stone-500">{shortDate(tx.date)} · {acc(tx.account_id)}{tx.note ? ` · ${tx.note}` : ''}</div>
      </div>
      <div className={`text-sm font-bold tabular-nums ${color}`}>{tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{idr(tx.amount)}</div>
      <button onClick={() => openEditor({ tx })} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Ubah"><Pencil size={15} /></button>
      <button onClick={() => deleteTx(tx)} className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600" aria-label="Hapus"><Trash2 size={15} /></button>
    </div>
  )
}
