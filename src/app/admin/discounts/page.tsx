'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Discount {
  id: string; type: string; targetId: string; targetName: string
  discountPercent: number; dateFrom: string; dateTo: string; active: boolean
}
interface Category { id: string; name: string }
interface Service { id: string; name: string; price: number; category?: { name: string } | null }

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [type, setType] = useState<'category' | 'service'>('service')
  const [targetId, setTargetId] = useState('')
  const [percent, setPercent] = useState('')
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10))
  const [dateTo, setDateTo] = useState('')
  const [error, setError] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/login'); return }
      return r.json()
    }).then(d => { if (d && d.role !== 'admin' && d.role !== 'superadmin') router.push('/pos') })
    loadData()
  }, [router])

  function loadData() {
    fetch('/api/discounts').then(r => r.json()).then(setDiscounts)
    fetch('/api/categories').then(r => r.json()).then(setCategories)
    fetch('/api/services').then(r => r.json()).then(setServices)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!targetId || !percent || !dateFrom || !dateTo) {
      setError('Semua field harus diisi')
      return
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      setError('Tanggal awal tidak boleh lebih besar dari tanggal akhir')
      return
    }

    const targetName = type === 'category'
      ? categories.find(c => c.id === targetId)?.name || ''
      : services.find(s => s.id === targetId)?.name || ''

    const res = await fetch('/api/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, targetId, targetName, discountPercent: percent, dateFrom, dateTo }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Gagal menyimpan')
      return
    }

    setTargetId(''); setPercent(''); setDateTo('')
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus diskon ini?')) return
    await fetch(`/api/discounts/${id}`, { method: 'DELETE' })
    loadData()
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch(`/api/discounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    loadData()
  }

  const fmt = (n: number) => n + '%'
  const isActive = (d: Discount) => d.active && new Date(d.dateFrom) <= new Date() && new Date(d.dateTo) >= new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-base md:text-lg font-bold tracking-wide">🏷️ Diskon</h1>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="text-xs md:text-sm bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-600 transition">☰ Menu</button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl min-w-[140px] py-1 z-50">
                  <button onClick={() => { setShowMenu(false); router.push('/pos') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🏠 Main</button>
                  <button onClick={() => { setShowMenu(false); router.push('/admin') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">⚙️ Master Jasa</button>
                  <button onClick={() => { setShowMenu(false); router.push('/admin/loyalty') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🎁 Loyalty</button>
                  <button onClick={() => { setShowMenu(false); router.push('/users') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">👥 Users</button>
                  <button onClick={() => { setShowMenu(false); router.push('/pembukuan') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">📊 Report</button>
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

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Tambah Diskon</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Level</label>
                <select value={type} onChange={e => { setType(e.target.value as 'category' | 'service'); setTargetId('') }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition">
                  <option value="service">Per Item (Service)</option>
                  <option value="category">Per Kategori</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">
                  {type === 'category' ? 'Kategori' : 'Service'}
                </label>
                <select value={targetId} onChange={e => setTargetId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition">
                  <option value="">-- Pilih --</option>
                  {type === 'category'
                    ? categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                    : services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                  }
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Diskon (%)</label>
                <input type="number" min="1" max="100" value={percent} onChange={e => setPercent(e.target.value)}
                  placeholder="10"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Dari</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Sampai</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition" />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" className="w-full md:w-auto bg-gray-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
              Simpan Diskon
            </button>
          </form>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Daftar Diskon</h2>
          <div className="space-y-2">
            {discounts.length === 0 && <p className="text-gray-400 text-center py-4 text-sm">Belum ada diskon</p>}
            {discounts.map(d => (
              <div key={d.id} className={`flex items-center justify-between p-3 rounded-xl border ${isActive(d) ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.type === 'category' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {d.type === 'category' ? 'Kategori' : 'Item'}
                    </span>
                    <p className="text-sm font-semibold text-gray-800">{d.targetName}</p>
                    <span className="text-sm font-bold text-green-600">{fmt(d.discountPercent)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(d.dateFrom).toLocaleDateString('id-ID')} — {new Date(d.dateTo).toLocaleDateString('id-ID')}
                    {isActive(d) && <span className="ml-2 text-green-600 font-medium">● Aktif</span>}
                    {!d.active && <span className="ml-2 text-gray-400">● Nonaktif</span>}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleToggle(d.id, d.active)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg transition ${d.active ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                    {d.active ? 'Off' : 'On'}
                  </button>
                  <button onClick={() => handleDelete(d.id)}
                    className="text-xs bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
