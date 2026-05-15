'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Service { id: string; name: string; price: number; categoryId: string | null; category?: { name: string } | null }
interface Category { id: string; name: string }

export default function AdminPage() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [catId, setCatId] = useState('')
  const [newCat, setNewCat] = useState('')
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
    await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCat }) })
    setNewCat('')
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

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">Admin - Master Jasa</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/users')} className="text-sm bg-purple-500 px-3 py-1 rounded hover:bg-purple-400">Users</button>
          <button onClick={() => router.push('/pos')} className="text-sm bg-blue-500 px-3 py-1 rounded hover:bg-blue-400">Kembali ke POS</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Jasa */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-gray-800 mb-4">{editId ? 'Edit Jasa' : 'Tambah Jasa'}</h2>
          <form onSubmit={handleSaveService} className="space-y-3">
            <input type="text" placeholder="Nama Jasa" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded text-gray-900" required />
            <input type="number" placeholder="Harga" value={price} onChange={e => setPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded text-gray-900" required />
            <select value={catId} onChange={e => setCatId(e.target.value)} className="w-full px-3 py-2 border rounded text-gray-900">
              <option value="">-- Pilih Kategori --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                {editId ? 'Update' : 'Simpan'}
              </button>
              {editId && <button type="button" onClick={() => { setEditId(null); setName(''); setPrice(''); setCatId('') }}
                className="bg-gray-300 px-4 py-2 rounded text-gray-700">Batal</button>}
            </div>
          </form>
        </div>

        {/* Form Kategori */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-gray-800 mb-4">Tambah Kategori</h2>
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input type="text" placeholder="Nama Kategori" value={newCat} onChange={e => setNewCat(e.target.value)}
              className="flex-1 px-3 py-2 border rounded text-gray-900" required />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Tambah</button>
          </form>
          <div className="mt-4 space-y-1">
            {categories.map(c => (
              <div key={c.id} className="text-sm text-gray-700 bg-gray-50 px-3 py-1 rounded">{c.name}</div>
            ))}
          </div>
        </div>

        {/* Daftar Jasa */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          {/* QRIS Settings */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-bold text-purple-800 mb-2">QRIS Settings</h3>
            <form onSubmit={handleSaveQris} className="flex gap-2">
              <input type="text" placeholder="QRIS Merchant ID / URL" value={qrisMerchant}
                onChange={e => setQrisMerchant(e.target.value)}
                className="flex-1 px-3 py-2 border rounded text-gray-900" />
              <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Simpan</button>
            </form>
            <p className="text-xs text-purple-600 mt-1">Masukkan nomor/URL QRIS merchant. Akan ditampilkan sebagai QR code saat pembayaran QRIS.</p>
          </div>

          <h2 className="font-bold text-gray-800 mb-4">Daftar Jasa</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-600">
                <th className="py-2">Nama</th><th>Kategori</th><th className="text-right">Harga</th><th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {services.map(svc => (
                <tr key={svc.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 text-gray-800">{svc.name}</td>
                  <td className="text-gray-600">{svc.category?.name || '-'}</td>
                  <td className="text-right text-gray-800">{fmt(svc.price)}</td>
                  <td className="text-right space-x-2">
                    <button onClick={() => handleEdit(svc)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(svc.id)} className="text-red-600 hover:underline">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
