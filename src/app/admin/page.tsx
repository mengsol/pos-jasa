'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Service { id: string; name: string; price: number; categoryId: string | null; category?: { name: string } | null }
interface Category { id: string; name: string; parentId?: string | null; children?: Category[] }

export default function AdminPage() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [catId, setCatId] = useState('')
  const [newCat, setNewCat] = useState('')
  const [newCatParent, setNewCatParent] = useState('')
  const [editCatId, setEditCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [user, setUser] = useState<{ role: string } | null>(null)
  const [qrisMerchant, setQrisMerchant] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/login'); return }
      return r.json()
    }).then(d => {
      if (d && d.role !== 'admin') { router.push('/pos'); return }
      setUser(d)
    })
    loadData()
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s.qris_merchant_id) setQrisMerchant(s.qris_merchant_id)
    })
  }, [router])

  function loadData() {
    fetch('/api/services').then(r => r.json()).then(setServices)
    fetch('/api/categories').then(r => r.json()).then(setCategories)
  }

  async function handleSaveService(e: React.FormEvent) {
    e.preventDefault()
    const body = { name, price: parseFloat(price), categoryId: catId || null }
    if (editId) {
      await fetch(`/api/services/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setName(''); setPrice(''); setCatId(''); setEditId(null)
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus jasa ini?')) return
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    loadData()
  }

  function handleEdit(svc: Service) {
    setEditId(svc.id); setName(svc.name); setPrice(String(svc.price)); setCatId(svc.categoryId || '')
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCat) return
    await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCat, parentId: newCatParent || null }) })
    setNewCat(''); setNewCatParent('')
    loadData()
  }

  async function handleEditCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!editCatId || !editCatName) return
    await fetch(`/api/categories/${editCatId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editCatName }) })
    setEditCatId(null); setEditCatName('')
    loadData()
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Hapus kategori ini?')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    loadData()
  }

  async function handleSaveQris(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'qris_merchant_id', value: qrisMerchant }),
    })
    alert('QRIS Merchant ID tersimpan!')
  }

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  const [showMenu, setShowMenu] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold tracking-wide">⚙️ Master Jasa</h1>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden md:inline text-sm text-gray-300">{user?.role === 'admin' ? 'Administrator' : user?.role} (admin)</span>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="text-sm bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-600 transition">☰ Menu</button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl min-w-[140px] py-1 z-50">
                  <button onClick={() => { setShowMenu(false); router.push('/pos') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🏠 Main</button>
                  <button onClick={() => { setShowMenu(false); router.push('/admin/discounts') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🏷️ Diskon</button>
                  <button onClick={() => { setShowMenu(false); router.push('/users') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">👥 Users</button>
                  <button onClick={() => { setShowMenu(false); router.push('/pembukuan') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">📊 Report</button>
                  <button onClick={() => { setShowMenu(false); router.push('/transaksi') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🧾 Transaksi</button>
                  <button onClick={() => { setShowMenu(false); router.push('/readme') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">📖 Readme</button>
                  <div className="border-t border-gray-700 my-1" />
                  <button onClick={handleLogout} className="w-full text-left text-sm px-4 py-2 text-red-400 hover:bg-gray-700 transition">🚪 Logout</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Form Jasa */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">{editId ? 'Edit Jasa' : 'Tambah Jasa'}</h2>
          <form onSubmit={handleSaveService} className="space-y-3">
            <input type="text" placeholder="Nama Jasa" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition" required />
            <input type="number" placeholder="Harga" value={price} onChange={e => setPrice(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition" required />
            <select value={catId} onChange={e => setCatId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition">
              <option value="">-- Pilih Kategori --</option>
              {categories.filter(c => !c.parentId).map(c => (
                <optgroup key={c.id} label={c.name}>
                  <option value={c.id}>{c.name} (langsung)</option>
                  {c.children?.map(child => <option key={child.id} value={child.id}>└ {child.name}</option>)}
                </optgroup>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
                {editId ? 'Update' : 'Simpan'}
              </button>
              {editId && <button type="button" onClick={() => { setEditId(null); setName(''); setPrice(''); setCatId('') }}
                className="bg-gray-100 px-4 py-2.5 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-200 transition">Batal</button>}
            </div>
          </form>
        </div>

        {/* Form Kategori */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">
            {editCatId ? 'Edit Kategori' : 'Tambah Kategori'}
          </h2>
          {editCatId ? (
            <form onSubmit={handleEditCategory} className="flex flex-col md:flex-row gap-2">
              <input type="text" placeholder="Nama Kategori" value={editCatName} onChange={e => setEditCatName(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition" required />
              <button type="submit" className="bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">Update</button>
              <button type="button" onClick={() => { setEditCatId(null); setEditCatName('') }}
                className="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Batal</button>
            </form>
          ) : (
            <form onSubmit={handleAddCategory} className="space-y-2">
              <input type="text" placeholder="Nama Kategori" value={newCat} onChange={e => setNewCat(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition" required />
              <select value={newCatParent} onChange={e => setNewCatParent(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition">
                <option value="">-- Parent (kosong = parent baru) --</option>
                {categories.filter(c => !c.parentId).map(c => (
                  <optgroup key={c.id} label={c.name}>
                    <option value={c.id}>{c.name}</option>
                    {c.children?.map(child => <option key={child.id} value={child.id}>└ {child.name}</option>)}
                  </optgroup>
                ))}
              </select>
              <button type="submit" className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">Tambah</button>
            </form>
          )}
          <div className="mt-4 space-y-1.5">
            {categories.filter(c => !c.parentId).map(c => (
              <div key={c.id}>
                <div className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg font-medium">
                  <span>📁 {c.name}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setEditCatId(c.id); setEditCatName(c.name) }}
                      className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-300 transition">Edit</button>
                    <button onClick={() => handleDeleteCategory(c.id)}
                      className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg hover:bg-red-100 transition">Hapus</button>
                  </div>
                </div>
                {c.children && c.children.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1">
                    {c.children.map(child => (
                      <div key={child.id} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50/50 px-3 py-1.5 rounded-lg">
                        <span>└ {child.name}</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => { setEditCatId(child.id); setEditCatName(child.name) }}
                            className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-300 transition">Edit</button>
                          <button onClick={() => handleDeleteCategory(child.id)}
                            className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg hover:bg-red-100 transition">Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Daftar Jasa */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:col-span-2">
          {/* QRIS Settings */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-2 text-sm">QRIS Settings</h3>
            <form onSubmit={handleSaveQris} className="flex flex-col md:flex-row gap-2">
              <input type="text" placeholder="QRIS Merchant ID / URL" value={qrisMerchant}
                onChange={e => setQrisMerchant(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition" />
              <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition">Simpan</button>
            </form>
            <p className="text-xs text-gray-500 mt-2">Masukkan nomor/URL QRIS merchant. Akan ditampilkan sebagai QR code saat pembayaran QRIS.</p>
          </div>

          <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Daftar Jasa</h2>
          
          {/* Mobile: card view */}
          <div className="md:hidden space-y-2">
            {[...services].sort((a, b) => (a.category?.name || '').localeCompare(b.category?.name || '')).map(svc => (
              <div key={svc.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">{svc.name}</p>
                  <p className="text-xs text-gray-500">{svc.category?.name || '-'} · {fmt(svc.price)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(svc)} className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-300 transition">Edit</button>
                  <button onClick={() => handleDelete(svc.id)} className="text-xs bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition">Hapus</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="py-2 pb-3">Nama</th><th>Kategori</th><th className="text-right">Harga</th><th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {[...services].sort((a, b) => (a.category?.name || '').localeCompare(b.category?.name || '')).map(svc => (
                  <tr key={svc.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 text-gray-800 font-medium">{svc.name}</td>
                    <td className="text-gray-500">{svc.category?.name || '-'}</td>
                    <td className="text-right text-gray-800">{fmt(svc.price)}</td>
                    <td className="text-right space-x-2">
                      <button onClick={() => handleEdit(svc)} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition">Edit</button>
                      <button onClick={() => handleDelete(svc.id)} className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-lg hover:bg-red-100 transition">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
