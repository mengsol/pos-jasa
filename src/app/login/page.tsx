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

    const data = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Login gagal')
      return
    }

    router.push('/pos')
  }

  return (
    <div
      className="min-h-screen min-h-dvh flex items-center justify-center px-4 py-8"
      style={{
        backgroundImage: `linear-gradient(rgba(250,245,242,0.80), rgba(250,245,242,0.88)), url("/bg.jpeg")`,
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundPosition: 'center, center',
        backgroundSize: 'cover, contain',
      }}
    >
      <div className="w-full max-w-sm md:max-w-md">
        {/* Logo area */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.3em] text-stone-700 uppercase">Ayunda</h1>
          <p className="text-xs md:text-sm tracking-[0.2em] text-stone-500 mt-1">Beauty Studio</p>
        </div>

        {/* Login card */}
        <div className="card-elegant p-6 md:p-8 rounded-3xl">
          <h2 className="text-base md:text-lg font-semibold text-stone-700 text-center mb-5 md:mb-6">Selamat Datang</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 input-elegant text-gray-900 placeholder-stone-400"
                placeholder="Masukkan username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 input-elegant text-gray-900 placeholder-stone-400"
                placeholder="Masukkan password"
                required
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
                <p className="text-rose-600 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3 rounded-xl active:scale-[0.98] disabled:opacity-50 text-sm uppercase tracking-wider mt-2"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-stone-400 text-xs mt-6">© 2026 Ayunda Beauty Studio</p>
      </div>
    </div>
  )
}
