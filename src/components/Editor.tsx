import { useData } from '../data'
import { ExpenseForm, NarikForm, TransferForm } from './Forms'
import { Sheet } from './ui'

export default function EditorHost() {
  const { editor, closeEditor } = useData()
  if (!editor) return null
  const { mode, tx } = editor
  const title = { expense: 'Pengeluaran', transfer: 'Transfer antar akun', narik: 'Pendapatan Narik' }[mode]
  return (
    <Sheet title={(tx ? 'Ubah ' : 'Tambah ') + title} onClose={closeEditor}>
      {mode === 'expense' && <ExpenseForm tx={tx} onDone={closeEditor} />}
      {mode === 'transfer' && <TransferForm tx={tx} onDone={closeEditor} />}
      {mode === 'narik' && <NarikForm tx={tx} onDone={closeEditor} />}
    </Sheet>
  )
}
