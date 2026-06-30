'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  name: string
  role: string
  outletId: string | null
  active: boolean
  createdAt: string
}

interface Outlet {
  id: string
  name: string
}

interface SessionUser {
  id: string
  role: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [session, setSession] = useState<SessionUser | null>(null)

  // form
  const [editId, setEditId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('kasir')
  const [outletId, setOutletId] = useState('')
  const [error, setError] = useState('')
  const [showMenu, setShowMenu] = useState(false)

  const router = useRouter()

  const loadUsers = useCallback(() => {
    fetch('/api/users')
      .then((r) => (r.ok ? r.json() : []))
      .then(setUsers)
  }, [])

  const loadOutlets = useCallback(async () => {
    // outlets endpoint belum ada, fallback: fetch tanpa auth check
    try {
      const r = await fetch('/api/outlets')
      if (r.ok) setOutlets(await r.json())
    } catch {
      // silent — outlets optional
    }
  }, [])

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => {
        if (!r.ok) {
          router.push('/login')
          return null
        }
        return r.json()
      })
      .then((d) => {
        if (!d) return
        if (d.role !== 'admin') {
          router.push('/pos')
          return
        }
        setSession(d)
        loadUsers()
        loadOutlets()
      })
  }, [router, loadUsers, loadOutlets])

  function resetForm() {
    setEditId(null)
    setUsername('')
    setPassword('')
    setName('')
    setRole('kasir')
    setOutletId('')
    setError('')
  }

  function handleEdit(u: User) {
    setEditId(u.id)
    setUsername(u.username)
    setPassword('') // blank — hanya diisi kalau mau ganti
    setName(u.name)
    setRole(u.role)
    setOutletId(u.outletId || '')
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const body: Record<string, unknown> = {
      username,
      name,
      role,
      outletId: outletId || null,
    }
    // password: required saat add, optional saat edit
    if (!editId) {
      if (!password) {
        setError('Password wajib diisi untuk user baru')
        return
      }
      body.password = password
    } else if (password) {
      body.password = password
    }

    const url = editId ? `/api/users/${editId}` : '/api/users'
    const method = editId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }))
      setError(err.error || 'Failed to save')
      return
    }

    resetForm()
    loadUsers()
  }

  async function handleDelete(u: User) {
    if (session && u.id === session.id) {
      alert('Tidak bisa hapus akun sendiri')
      return
    }
    if (!confirm(`Hapus user "${u.username}"?`)) return
    const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }))
      alert(err.error || 'Failed to delete')
      return
    }
    loadUsers()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold tracking-wide">👥 User Management</h1>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="text-sm bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-600 transition">☰ Menu</button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl min-w-[140px] py-1 z-50">
                  <button onClick={() => { setShowMenu(false); router.push('/pos') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🏠 Main</button>
                  <button onClick={() => { setShowMenu(false); router.push('/admin') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">⚙️ Master Jasa</button>
                  <button onClick={() => { setShowMenu(false); router.push('/admin/discounts') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🏷️ Diskon</button>
                  <button onClick={() => { setShowMenu(false); router.push('/admin/loyalty') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🎁 Loyalty</button>
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

      <div className="p-4 md:p-6 grid md:grid-cols-3 gap-4">
        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">
            {editId ? 'Edit User' : 'Add User'}
          </h2>
          {error && (
            <div className="mb-3 p-2.5 text-sm bg-red-50 text-red-600 rounded-xl border border-red-100">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">
                Password {editId && '(kosongkan jika tidak diubah)'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editId}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={editId === session?.id}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition disabled:bg-gray-50"
              >
                <option value="kasir">Kasir</option>
                <option value="admin">Admin</option>
              </select>
              {editId === session?.id && (
                <p className="text-xs text-gray-400 mt-1">
                  Tidak bisa ubah role akun sendiri
                </p>
              )}
            </div>
            {outlets.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Outlet</label>
                <select
                  value={outletId}
                  onChange={(e) => setOutletId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition"
                >
                  <option value="">— Tidak ada —</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition"
              >
                {editId ? 'Update' : 'Add'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Daftar User</h2>
          
          {/* Mobile: card view */}
          <div className="md:hidden space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {u.username}
                    {u.id === session?.id && <span className="ml-1 text-xs text-gray-400">(you)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{u.name} · <span className={u.role === 'admin' ? 'text-purple-600' : 'text-gray-500'}>{u.role}</span></p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleEdit(u)} className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-300 transition">Edit</button>
                  <button onClick={() => handleDelete(u)} disabled={u.id === session?.id}
                    className="text-xs bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-40">Del</button>
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">Belum ada user</p>}
          </div>

          {/* Desktop: table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="py-2 px-2 pb-3">Username</th>
                  <th className="py-2 px-2 pb-3">Nama</th>
                  <th className="py-2 px-2 pb-3">Role</th>
                  <th className="py-2 px-2 pb-3">Created</th>
                  <th className="py-2 px-2 pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-2 font-medium text-gray-800">
                      {u.username}
                      {u.id === session?.id && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-gray-700">{u.name}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-medium ${
                        u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-2 text-right space-x-1.5">
                      <button onClick={() => handleEdit(u)}
                        className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-200 transition">Edit</button>
                      <button onClick={() => handleDelete(u)} disabled={u.id === session?.id}
                        className="text-xs bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-40 disabled:cursor-not-allowed">Delete</button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="py-8 px-2 text-center text-gray-400">Belum ada user</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
