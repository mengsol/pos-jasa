'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Payment { method: string; amount: number }
interface Transaction {
  id: string; invoiceNo: string; totalAmount: number; createdAt: string
  user: { name: string }; outlet: { name: string }
  payments: Payment[]; items: { serviceName: string; qty: number; subtotal: number }[]
}

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/login'); return }
      return r.json()
    }).then(d => {
      if (d) {
        setUser(d)
        loadTransactions(d.id)
      }
    })
  }, [router])

  function loadTransactions(userId: string) {
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/transactions?from=${today}&to=${today}&userId=${userId}`)
      .then(r => r.json()).then(setTransactions)
  }

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')
  const totalToday = transactions.reduce((s, t) => s + t.totalAmount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold tracking-wide">🧾 Transaksi Hari Ini</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">{user?.name}</span>
          <button onClick={() => router.push('/pos')} className="text-sm bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-600 transition">← Back to Main</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">Jumlah Transaksi</p>
            <p className="text-2xl font-bold text-gray-800">{transactions.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">Total Hari Ini</p>
            <p className="text-2xl font-bold text-gray-800">{fmt(totalToday)}</p>
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {transactions.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-400">Belum ada transaksi hari ini</p>
            </div>
          )}
          {transactions.map(t => (
            <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{t.invoiceNo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {t.payments.map(p => p.method).join(', ')}
                  </p>
                </div>
                <p className="font-bold text-gray-800">{fmt(t.totalAmount)}</p>
              </button>
              {expandedId === t.id && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-1">
                  {t.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-600">
                      <span>{item.serviceName} x{item.qty}</span>
                      <span>{fmt(item.subtotal)}</span>
                    </div>
                  ))}
                  <div className="border-t border-dashed border-gray-200 pt-2 mt-2 flex justify-between text-xs text-gray-400">
                    <span>Bayar: {fmt(t.payments.reduce((s, p) => s + p.amount, 0))}</span>
                    <span>Kembali: {fmt(t.payments.reduce((s, p) => s + p.amount, 0) - t.totalAmount)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
