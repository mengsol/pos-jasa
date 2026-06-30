'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Payment { method: string; amount: number }
interface Transaction {
  id: string; invoiceNo: string; totalAmount: number; createdAt: string; status: string
  cancelUser?: string; approvedUser?: string; cancelDate?: string; cancelReason?: string
  user: { name: string }; outlet: { name: string }
  payments: Payment[]; items: { serviceName: string; qty: number; price: number; originalPrice?: number; discountPercent?: number; subtotal: number }[]
}

export default function PembukuanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tab, setTab] = useState<'all' | 'cash' | 'cashless'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'cancelled'>('all')
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/login'); return }
      return r.json()
    }).then(d => {
      if (d && d.role !== 'admin' && d.role !== 'superadmin') router.push('/pos')
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

  // Filter by status dropdown
  const statusFiltered = filterStatus === 'all' ? transactions
    : filterStatus === 'completed' ? completedTx : cancelledTx

  // Then filter by payment method tab
  const filtered = tab === 'cash' ? statusFiltered.filter(t => t.payments.some(p => p.method === 'cash'))
    : tab === 'cashless' ? statusFiltered.filter(t => t.payments.every(p => p.method !== 'cash'))
    : statusFiltered

  const totalCompleted = completedTx.reduce((s, t) => s + t.totalAmount, 0)
  const totalCancelled = cancelledTx.reduce((s, t) => s + t.totalAmount, 0)
  const totalCash = completedTx.filter(t => t.payments.some(p => p.method === 'cash')).reduce((s, t) => s + t.totalAmount, 0)
  const totalCashless = completedTx.filter(t => t.payments.every(p => p.method !== 'cash')).reduce((s, t) => s + t.totalAmount, 0)

  return (
    <div className="app-shell">
      <div className="topbar px-4 py-3 flex justify-between items-center">
        <h1 className="topbar-title text-lg">📊 Report</h1>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="text-sm bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-600 transition">☰ Menu</button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 menu-panel rounded-xl min-w-[150px] py-1.5 z-50 text-white">
                  <button onClick={() => { setShowMenu(false); router.push('/pos') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🏠 Main</button>
                  <button onClick={() => { setShowMenu(false); router.push('/admin') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">⚙️ Master Jasa</button>
                  <button onClick={() => { setShowMenu(false); router.push('/admin/discounts') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🏷️ Diskon</button>
                  <button onClick={() => { setShowMenu(false); router.push('/admin/loyalty') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🎁 Loyalty</button>
                  <button onClick={() => { setShowMenu(false); router.push('/users') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">👥 Users</button>
                  <button onClick={() => { setShowMenu(false); router.push('/transaksi') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🧾 Transaksi</button>
                  <button onClick={() => { setShowMenu(false); router.push('/readme') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">📖 Readme</button>
                  <div className="border-t border-gray-700 my-1" />
                  <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }} className="w-full text-left text-sm px-4 py-2 text-red-400 hover:bg-gray-700 transition">🚪 Logout</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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

        {/* Reward Summary */}
        {completedTx.some(t => t.items.some(i => i.serviceName.includes('REWARD') || (i.discountPercent === 100 && i.subtotal === 0))) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">Loyalty Reward</p>
              <p className="text-xs text-yellow-700">
                {completedTx.reduce((count, t) => count + t.items.filter(i => i.serviceName.includes('REWARD') || (i.discountPercent === 100 && i.subtotal === 0)).length, 0)} reward diklaim dalam periode ini
              </p>
            </div>
          </div>
        )}

        {/* Grand Total */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 text-center">
          <p className="text-sm text-green-700">Total Pendapatan (Completed)</p>
          <p className="text-3xl font-bold text-green-800">{fmt(totalCompleted)}</p>
        </div>

        {/* Transaction Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 border-b text-xs">
                <th className="px-4 py-3">Invoice</th>
                <th>Waktu</th>
                <th>Kasir</th>
                <th>Item</th>
                <th className="text-right">Harga Satuan</th>
                <th>Status</th>
                <th className="text-right">Harga</th>
                <th className="text-right">Diskon</th>
                <th className="text-right pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <>
                  <tr key={t.id} className={`border-b cursor-pointer transition ${t.status === 'cancelled' ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                    <td className="px-4 py-2 font-mono text-xs text-gray-800">{t.invoiceNo}</td>
                    <td className="text-gray-600 text-xs whitespace-nowrap">{new Date(t.createdAt).toLocaleString('id-ID')}</td>
                    <td className="text-gray-700 text-xs">{t.user.name}</td>
                    <td className="text-gray-600 text-xs max-w-[150px] truncate">
                      {t.items.map(i => {
                        const isReward = i.serviceName.includes('REWARD') || (i.discountPercent === 100 && i.subtotal === 0)
                        return `${i.serviceName} x${i.qty}${isReward ? ' 🎁' : ''}`
                      }).join(', ')}
                    </td>
                    <td className="text-right text-xs text-gray-700 whitespace-nowrap">
                      {t.items.map(i => fmt(i.originalPrice || i.price)).join(', ')}
                    </td>
                    <td>
                      {t.status === 'cancelled' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">Cancelled</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Completed</span>
                      )}
                    </td>
                    <td className="text-right text-xs text-gray-700 whitespace-nowrap">
                      {fmt(t.items.reduce((s, i) => s + (i.originalPrice || i.price) * i.qty, 0))}
                    </td>
                    <td className="text-right text-xs whitespace-nowrap">
                      {t.items.reduce((s, i) => s + (i.originalPrice || i.price) * i.qty, 0) - t.totalAmount > 0 ? (
                        <span className="text-red-600 font-medium">
                          -{fmt(t.items.reduce((s, i) => s + (i.originalPrice || i.price) * i.qty, 0) - t.totalAmount)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className={`text-right pr-4 font-medium whitespace-nowrap ${t.status === 'cancelled' ? 'text-red-500 line-through' : 'text-gray-800'}`}>{fmt(t.totalAmount)}</td>
                  </tr>
                  {expandedId === t.id && (
                    <tr key={t.id + '-detail'} className="bg-gray-50/50">
                      <td colSpan={9} className="px-6 py-3">
                        <div className="space-y-2">
                          <div className="text-xs">
                            <p className="font-medium text-gray-500 uppercase tracking-wider mb-1">Detail:</p>
                            {t.items.map((item, i) => {
                              const isReward = item.serviceName.includes('REWARD') || (item.discountPercent === 100 && item.subtotal === 0)
                              return (
                                <div key={i} className="flex justify-between py-0.5">
                                  <span className="text-gray-700">
                                    {item.serviceName} x{item.qty} @ {fmt(item.price)}
                                    {isReward ? (
                                      <span className="ml-1 inline-block px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded">🎁 LOYALTY REWARD</span>
                                    ) : (item.discountPercent || 0) > 0 ? (
                                      <span className="text-red-500 ml-1">(disc {item.discountPercent}% dari {fmt(item.originalPrice || item.price)})</span>
                                    ) : null}
                                  </span>
                                  <span className={`font-medium ${isReward ? 'text-yellow-600' : 'text-gray-800'}`}>
                                    {isReward ? 'GRATIS' : fmt(item.subtotal)}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                          <div className="text-xs border-t border-gray-200 pt-1">
                            <span className="text-gray-500">Bayar: </span>
                            {t.payments.map((p, i) => (
                              <span key={i} className="text-gray-700">{p.method.toUpperCase()} {fmt(p.amount)} </span>
                            ))}
                            {t.payments[0]?.method === 'cash' && t.payments.reduce((s, p) => s + p.amount, 0) > t.totalAmount && (
                              <span className="text-green-600 font-medium ml-2">| Kembalian: {fmt(t.payments.reduce((s, p) => s + p.amount, 0) - t.totalAmount)}</span>
                            )}
                          </div>
                          {t.status === 'cancelled' && (
                            <div className="border-t border-red-200 pt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                              <div><span className="text-gray-500">Cancel by:</span> <span className="text-red-700 font-medium">{t.cancelUser || '-'}</span></div>
                              <div><span className="text-gray-500">Approved by:</span> <span className="text-red-700 font-medium">{t.approvedUser || '-'}</span></div>
                              <div><span className="text-gray-500">Cancel date:</span> <span className="text-red-700 font-medium">{t.cancelDate ? new Date(t.cancelDate).toLocaleString('id-ID') : '-'}</span></div>
                              <div><span className="text-gray-500">Reason:</span> <span className="text-red-700 font-medium">{t.cancelReason || '-'}</span></div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Tidak ada transaksi</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  )
}
