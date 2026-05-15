'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Payment { method: string; amount: number }
interface Transaction {
  id: string; invoiceNo: string; totalAmount: number; createdAt: string
  user: { name: string }; outlet: { name: string }
  payments: Payment[]; items: { serviceName: string; qty: number; subtotal: number }[]
}

export default function PembukuanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tab, setTab] = useState<'all' | 'cash' | 'cashless'>('all')
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => { if (!r.ok) router.push('/login') })
  }, [router])

  useEffect(() => { loadData() }, [from, to, tab])

  function loadData() {
    const method = tab === 'all' ? '' : tab
    fetch(`/api/transactions?from=${from}&to=${to}${method ? `&method=${method}` : ''}`)
      .then(r => r.json()).then(setTransactions)
  }

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')
  const totalAll = transactions.reduce((s, t) => s + t.totalAmount, 0)
  const totalCash = transactions.reduce((s, t) => s + t.payments.filter(p => p.method === 'cash').reduce((a, p) => a + p.amount, 0), 0)
  const totalCashless = transactions.reduce((s, t) => s + t.payments.filter(p => p.method !== 'cash').reduce((a, p) => a + p.amount, 0), 0)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-green-600 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">Pembukuan</h1>
        <button onClick={() => router.push('/pos')} className="text-sm bg-green-500 px-3 py-1 rounded hover:bg-green-400">Kembali ke POS</button>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Dari</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 border rounded text-gray-900" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Sampai</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 border rounded text-gray-900" />
          </div>
          <div className="flex gap-1">
            {(['all', 'cash', 'cashless'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded text-sm font-medium ${tab === t ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {t === 'all' ? 'Semua' : t === 'cash' ? 'Cash' : 'Cashless'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Transaksi</p>
            <p className="text-2xl font-bold text-gray-800">{transactions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Cash</p>
            <p className="text-2xl font-bold text-green-600">{fmt(totalCash)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Cashless</p>
            <p className="text-2xl font-bold text-blue-600">{fmt(totalCashless)}</p>
          </div>
        </div>

        {/* Grand Total */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-green-700">Total Pendapatan</p>
          <p className="text-3xl font-bold text-green-800">{fmt(totalAll)}</p>
        </div>

        {/* Transaction Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 border-b">
                <th className="px-4 py-3">Invoice</th>
                <th>Waktu</th>
                <th>Kasir</th>
                <th>Item</th>
                <th>Metode</th>
                <th className="text-right pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-800">{t.invoiceNo}</td>
                  <td className="text-gray-600 text-xs">{new Date(t.createdAt).toLocaleString('id-ID')}</td>
                  <td className="text-gray-700">{t.user.name}</td>
                  <td className="text-gray-600 text-xs">{t.items.map(i => `${i.serviceName} x${i.qty}`).join(', ')}</td>
                  <td>
                    {t.payments.map((p, i) => (
                      <span key={i} className={`inline-block px-2 py-0.5 rounded text-xs mr-1 ${p.method === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {p.method}
                      </span>
                    ))}
                  </td>
                  <td className="text-right pr-4 font-medium text-gray-800">{fmt(t.totalAmount)}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada transaksi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
