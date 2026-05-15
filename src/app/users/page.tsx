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
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">User Management — Ayunda Beauty Studio</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/pos')}
            className="text-sm bg-blue-500 px-3 py-1 rounded hover:bg-blue-400"
          >
            POS
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="text-sm bg-blue-500 px-3 py-1 rounded hover:bg-blue-400"
          >
            Admin
          </button>
          <button
            onClick={() => router.push('/pembukuan')}
            className="text-sm bg-green-500 px-3 py-1 rounded hover:bg-green-400"
          >
            Pembukuan
          </button>
        </div>
      </div>

      <div className="p-6 grid md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-bold text-gray-800 mb-3">
            {editId ? 'Edit User' : 'Add User'}
          </h2>
          {error && (
            <div className="mb-3 p-2 text-sm bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Password {editId && '(kosongkan kalau tidak diubah)'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editId}
                className="w-full px-3 py-2 border rounded-md text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={editId === session?.id}
                className="w-full px-3 py-2 border rounded-md text-gray-900 disabled:bg-gray-100"
              >
                <option value="kasir">Kasir</option>
                <option value="admin">Admin</option>
              </select>
              {editId === session?.id && (
                <p className="text-xs text-gray-500 mt-1">
                  Tidak bisa ubah role akun sendiri
                </p>
              )}
            </div>
            {outlets.length > 0 && (
              <div>
                <label className="block text-sm text-gray-700 mb-1">Outlet</label>
                <select
                  value={outletId}
                  onChange={(e) => setOutletId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-gray-900"
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
                className="flex-1 bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700"
              >
                {editId ? 'Update' : 'Add'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-md font-medium hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
          <h2 className="font-bold text-gray-800 mb-3">Daftar User</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-700">
                  <th className="py-2 px-2">Username</th>
                  <th className="py-2 px-2">Nama</th>
                  <th className="py-2 px-2">Role</th>
                  <th className="py-2 px-2">Created</th>
                  <th className="py-2 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium text-gray-800">
                      {u.username}
                      {u.id === session?.id && (
                        <span className="ml-2 text-xs text-blue-600">(you)</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-gray-700">{u.name}</td>
                    <td className="py-2 px-2">
                      <span
                        className={
                          u.role === 'admin'
                            ? 'inline-block px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700 font-medium'
                            : 'inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 font-medium'
                        }
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-2 px-2 text-right space-x-1">
                      <button
                        onClick={() => handleEdit(u)}
                        className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={u.id === session?.id}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-4 px-2 text-center text-gray-500"
                    >
                      Belum ada user
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
