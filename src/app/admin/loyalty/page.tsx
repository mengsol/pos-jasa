'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Service { id: string; name: string; price: number }
interface LoyaltyConfig {
  id: string
  minTransactions: number
  withinDays: number
  claimDaysLimit: number
  rewardServiceId: string | null
  isActive: boolean
}

export default function LoyaltyConfigPage() {
  const [config, setConfig] = useState<LoyaltyConfig | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<{ role: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/login'); return }
      return r.json()
    }).then(d => {
      if (d && d.role !== 'admin' && d.role !== 'superadmin') { router.push('/pos'); return }
      setUser(d)
    })
    fetch('/api/loyalty/config').then(r => r.json()).then(setConfig)
    fetch('/api/services').then(r => r.json()).then(setServices)
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!config) return
    setSaving(true)
    await fetch('/api/loyalty/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        minTransactions: config.minTransactions,
        withinDays: config.withinDays,
        claimDaysLimit: config.claimDaysLimit,
        rewardServiceId: config.rewardServiceId || null,
        isActive: config.isActive,
      }),
    })
    setSaving(false)
    alert('Konfigurasi loyalty tersimpan!')
  }

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  if (!user || !config) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold tracking-wide">🎁 Loyalty Reward</h1>
        <button onClick={() => router.push('/pos')} className="text-sm bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-600 transition">← Kembali</button>
      </div>

      <div className="max-w-lg mx-auto p-4 md:p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-800 text-base">Konfigurasi Program Loyalty</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.isActive}
                onChange={e => setConfig({ ...config, isActive: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <span className={`text-sm font-medium ${config.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                {config.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
            </label>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah Transaksi Minimum
              </label>
              <input
                type="number"
                min="1"
                value={config.minTransactions}
                onChange={e => setConfig({ ...config, minTransactions: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Berapa kali transaksi untuk dapat reward</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dalam Rentang Hari (Window)
              </label>
              <input
                type="number"
                min="1"
                value={config.withinDays}
                onChange={e => setConfig({ ...config, withinDays: parseInt(e.target.value) || 30 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Transaksi dihitung dalam X hari terakhir</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batas Waktu Klaim (hari)
              </label>
              <input
                type="number"
                min="1"
                value={config.claimDaysLimit}
                onChange={e => setConfig({ ...config, claimDaysLimit: parseInt(e.target.value) || 60 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Setelah reward ter-unlock, pelanggan punya X hari untuk klaim.
                Jika tidak diklaim dalam waktu ini, reward hangus.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Gratis (Reward)
              </label>
              <select
                value={config.rewardServiceId || ''}
                onChange={e => setConfig({ ...config, rewardServiceId: e.target.value || null })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm"
              >
                <option value="">-- Bebas pilih saat klaim --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({fmt(s.price)})</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Kosongkan jika kasir boleh pilih treatment gratis saat klaim</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-medium">📋 Ringkasan:</p>
              <p className="mt-1">
                Pelanggan yang melakukan <strong>{config.minTransactions}x transaksi</strong> dalam{' '}
                <strong>{config.withinDays} hari</strong> akan mendapat{' '}
                <strong>1 treatment gratis</strong>
                {config.rewardServiceId && services.find(s => s.id === config.rewardServiceId)
                  ? ` (${services.find(s => s.id === config.rewardServiceId)!.name})`
                  : ' (bebas pilih)'}
                .
              </p>
              <p className="mt-1">
                Reward bisa diklaim dalam <strong>{config.claimDaysLimit} hari</strong> setelah ter-unlock.
                Jika tidak diklaim, reward akan hangus.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-700 disabled:opacity-50 transition"
            >
              {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
