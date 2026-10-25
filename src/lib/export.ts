import { Account, Category, Tx } from './types'

const typeLabel = (t: Tx) => (t.type === 'income' ? 'Pendapatan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer')

export function txRows(txs: Tx[], accounts: Account[], cats: Category[]) {
  const acc = new Map(accounts.map((a) => [a.id, a.name]))
  const cat = new Map(cats.map((c) => [c.id, c.name]))
  return txs.map((t) => [
    t.date, typeLabel(t),
    t.type === 'transfer' ? `${acc.get(t.account_id) ?? '-'} > ${acc.get(t.to_account_id ?? '') ?? '-'}` : t.source === 'narik' ? 'Pendapatan Narik' : cat.get(t.category_id ?? '') ?? '-',
    acc.get(t.account_id) ?? '-', String(t.amount), t.note ?? '',
  ])
}
export const TX_HEAD = ['Tanggal', 'Jenis', 'Kategori', 'Akun', 'Nominal (Rp)', 'Catatan']

export function exportCsv(head: string[], rows: string[][], name: string) {
  const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function exportPdf(title: string, head: string[], rows: string[][], name: string) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF()
  doc.setFontSize(13)
  doc.text(title, 14, 15)
  autoTable(doc, { head: [head], body: rows, startY: 21, styles: { fontSize: 8 }, headStyles: { fillColor: [10, 58, 37] } })
  doc.save(name)
}
