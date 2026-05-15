'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Payment { method: string; amount: number }
interface Transaction {
  id: string; invoiceNo: string; totalAmount: number; createdAt: string; status: string
  cancelUser?: string; approvedUser?: string; cancelDate?: string; cancelReason?: string
  user: { name: string }; outlet: { name: string }
  payments: Payment[]; items: { serviceName: string; qty: number; subtotal: number }[]
}

export default function PembukuanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tab, setTab] = useState<'all' | 'cash' | 'cashless' | 'cancelled'>('all')
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/login'); return }
      return r.json()
    }).then(d => {
      if (d && d.role !== 'admin') router.push('/pos')
    })
  }, [router])

  useEffect(() => { loadData() }, [from, to])

  function loadData() {
    fetch(`/api/transactions?from=${from}&to=${to}`)
      .then(r => r.json()).then(setTransactions)
  }

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  const completedTx = transactions.filter(t => t.status === 'completed')
  const cancelledTx = transactions.filter(t => t.status === 'cancelled')

  const filtered = tab === 'cancelled' ? cancelledTx
    : tab === 'cash' ? completedTx.filter(t => t.payments.some(p => p.method === 'cash'))
    : tab === 'cashless' ? completedTx.filter(t => t.payments.every(p => p.method !== 'cash'))
    : transactions

  const totalCompleted = completedTx.reduce((s, t) => s + t.totalAmount, 0)
  const totalCancelled = cancelledTx.reduce((s, t) => s + t.totalAmount, 0)
  const totalCash = completedTx.reduce((s, t) => s + t.payments.filter(p => p.method === 'cash').reduce((a, p) => a + p.amount, 0), 0)
  const totalCashless = completedTx.reduce((s, t) => s + t.payments.filter(p => p.method !== 'cash').reduce((a, p) => a + p.amount, 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold tracking-wide">📊 Report</h1>
        <button onClick={() => router.push('/pos')} className="text-sm bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-600 transition">← Back to Main</button>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Dari</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 border rounded-lg text-gray-900" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Sampai</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 border rounded-lg text-gray-900" />
          </div>
          <div className="flex gap-1">
            {(['all', 'cash', 'cashless'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  tab === t ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                {t === 'all' ? 'Semua' : t === 'cash' ? 'Cash' : 'Cashless'}
              </button>
            ))}
          </div>
          <div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'all' | 'completed' | 'cancelled')}
              className="px-3 py-2 border rounded-lg text-gray-900 text-sm font-medium focus:outline-none focus:border-gray-400">
              <option value="all">All Status</option>
              <option value="completed">Success Only</option>
              <option value="cancelled">Cancel Only</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Transaksi</p>
            <p className="text-2xl font-bold text-gray-800">{completedTx.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Cash</p>
            <p className="text-2xl font-bold text-green-600">{fmt(totalCash)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Cashless</p>
            <p className="text-2xl font-bold text-blue-600">{fmt(totalCashless)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-4">
            <p className="text-sm text-gray-500">Cancelled</p>
            <p className="text-2xl font-bold text-red-500">{cancelledTx.length} ({fmt(totalCancelled)})</p>
          </div>
        </div>

        {/* Grand Total */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
          <p className="text-sm text-green-700">Total Pendapatan (Completed)</p>
          <p className="text-3xl font-bold text-green-800">{fmt(totalCompleted)}</p>
        </div>

        {/* Transaction Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 border-b">
                <th className="px-4 py-3">Invoice</th>
                <th>Waktu</th>
                <th>Kasir</th>
                <th>Item</th>
                <th>Status</th>
                <th className="text-right pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <>
                  <tr key={t.id} className={`border-b cursor-pointer transition ${t.status === 'cancelled' ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                    <td className="px-4 py-2 font-mono text-xs text-gray-800">{t.invoiceNo}</td>
                    <td className="text-gray-600 text-xs">{new Date(t.createdAt).toLocaleString('id-ID')}</td>
                    <td className="text-gray-700">{t.user.name}</td>
                    <td className="text-gray-600 text-xs max-w-[200px] truncate">{t.items.map(i => `${i.serviceName} x${i.qty}`).join(', ')}</td>
                    <td>
                      {t.status === 'cancelled' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">Cancelled</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Completed</span>
                      )}
                    </td>
                    <td className={`text-right pr-4 font-medium ${t.status === 'cancelled' ? 'text-red-500 line-through' : 'text-gray-800'}`}>{fmt(t.totalAmount)}</td>
                  </tr>
                  {expandedId === t.id && t.status === 'cancelled' && (
                    <tr key={t.id + '-detail'} className="bg-red-50/30">
                      <td colSpan={6} className="px-6 py-3">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                          <div><span className="text-gray-500">Cancel by:</span> <span className="text-red-700 font-medium">{t.cancelUser || '-'}</span></div>
                          <div><span className="text-gray-500">Approved by:</span> <span className="text-red-700 font-medium">{t.approvedUser || '-'}</span></div>
                          <div><span className="text-gray-500">Cancel date:</span> <span className="text-red-700 font-medium">{t.cancelDate ? new Date(t.cancelDate).toLocaleString('id-ID') : '-'}</span></div>
                          <div><span className="text-gray-500">Reason:</span> <span className="text-red-700 font-medium">{t.cancelReason || '-'}</span></div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada transaksi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
