'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Login gagal')
      return
    }

    router.push('/pos')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/bg.jpeg')] bg-cover bg-center bg-fixed bg-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light tracking-[0.3em] text-white/90 uppercase">Ayunda</h1>
          <p className="text-sm tracking-[0.2em] text-white/60 mt-1">Beauty Studio</p>
        </div>

        {/* Login card */}
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20">
          <h2 className="text-lg font-medium text-white/90 text-center mb-6">Selamat Datang</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30
                           focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200"
                placeholder="Masukkan username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30
                           focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200"
                placeholder="Masukkan password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-gray-900 py-3 rounded-xl font-semibold
                         hover:bg-white/90 active:scale-[0.98] disabled:opacity-50
                         transition-all duration-200 text-sm uppercase tracking-wider mt-2"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">© 2026 Ayunda Beauty Studio</p>
      </div>
    </div>
  )
}
