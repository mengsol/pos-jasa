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

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Transaction | null>(null)
  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'cancelled'>('all')
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

  async function handleCancel() {
    if (!cancelTarget || !adminUser || !adminPass || !cancelReason) {
      setCancelError('Semua field harus diisi')
      return
    }
    setCancelLoading(true)
    setCancelError('')

    const res = await fetch(`/api/transactions/${cancelTarget.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminUsername: adminUser,
        adminPassword: adminPass,
        reason: cancelReason,
      }),
    })

    const data = await res.json()
    setCancelLoading(false)

    if (!res.ok) {
      setCancelError(data.error || 'Gagal cancel transaksi')
      return
    }

    // Success - close modal and reload
    setCancelTarget(null)
    setAdminUser('')
    setAdminPass('')
    setCancelReason('')
    if (user) loadTransactions(user.id)
  }

  function closeCancelModal() {
    setCancelTarget(null)
    setAdminUser('')
    setAdminPass('')
    setCancelReason('')
    setCancelError('')
  }

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')
  const completedTx = transactions.filter(t => t.status === 'completed')
  const cancelledTx = transactions.filter(t => t.status === 'cancelled')
  const filteredTx = filterStatus === 'all' ? transactions
    : filterStatus === 'completed' ? completedTx : cancelledTx
  const totalToday = completedTx.reduce((s, t) => s + t.totalAmount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-base md:text-lg font-bold tracking-wide">🧾 Transaksi Hari Ini</h1>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden md:inline text-sm text-gray-300">{user?.name}</span>
          <button onClick={() => router.push('/pos')} className="text-xs md:text-sm bg-gray-700 px-2.5 md:px-3 py-1.5 rounded-lg hover:bg-gray-600 transition">← Back</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">Transaksi</p>
            <p className="text-2xl font-bold text-gray-800">{completedTx.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">Total Hari Ini</p>
            <p className="text-2xl font-bold text-gray-800">{fmt(totalToday)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">Cancelled</p>
            <p className="text-2xl font-bold text-red-500">{cancelledTx.length}</p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="mb-4">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'all' | 'completed' | 'cancelled')}
            className="px-3 py-2 border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:outline-none focus:border-gray-400 bg-white">
            <option value="all">All Status</option>
            <option value="completed">Success Only</option>
            <option value="cancelled">Cancel Only</option>
          </select>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTx.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-400">Belum ada transaksi hari ini</p>
            </div>
          )}
          {filteredTx.map(t => (
            <div key={t.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${t.status === 'cancelled' ? 'border-red-200 bg-red-50/50' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between px-5 py-4">
                <button
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-sm">{t.invoiceNo}</p>
                    {t.status === 'cancelled' && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Cancelled</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {t.payments.map(p => p.method).join(', ')}
                  </p>
                </button>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-gray-800">{fmt(t.totalAmount)}</p>
                  {t.status === 'completed' && (
                    <button
                      onClick={() => setCancelTarget(t)}
                      className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 transition font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
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
                  {t.status === 'cancelled' && (
                    <div className="border-t border-red-200 pt-2 mt-2 space-y-0.5">
                      <p className="text-xs text-red-600 font-medium">Cancel Info:</p>
                      <p className="text-xs text-red-500">Cancel by: {t.cancelUser}</p>
                      <p className="text-xs text-red-500">Approved by: {t.approvedUser}</p>
                      <p className="text-xs text-red-500">Reason: {t.cancelReason}</p>
                      <p className="text-xs text-red-500">Date: {t.cancelDate ? new Date(t.cancelDate).toLocaleString('id-ID') : '-'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-red-50 px-5 py-4 border-b border-red-100">
              <h2 className="font-bold text-red-800 text-lg">Cancel Transaksi</h2>
              <p className="text-sm text-red-600 mt-0.5">{cancelTarget.invoiceNo}</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Items being cancelled */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Item yang di-cancel:</p>
                {cancelTarget.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-700">
                    <span>{item.serviceName} x{item.qty}</span>
                    <span>{fmt(item.subtotal)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between font-bold text-sm text-gray-800">
                  <span>Total</span>
                  <span>{fmt(cancelTarget.totalAmount)}</span>
                </div>
              </div>

              {/* Admin approval — only for kasir */}
              {user?.role !== 'admin' && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Persetujuan Admin</p>
                  <input
                    type="text"
                    placeholder="Username Admin"
                    value={adminUser}
                    onChange={e => setAdminUser(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm mb-2 focus:outline-none focus:border-gray-400 transition"
                  />
                  <input
                    type="password"
                    placeholder="Password Admin"
                    value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition"
                  />
                </div>
              )}

              {/* Reason */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Alasan Cancel</p>
                <textarea
                  placeholder="Masukkan alasan cancel..."
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm resize-none focus:outline-none focus:border-gray-400 transition"
                />
              </div>

              {cancelError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                  <p className="text-red-600 text-sm text-center">{cancelError}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={closeCancelModal}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium text-sm hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {cancelLoading ? 'Memproses...' : 'Konfirmasi Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
