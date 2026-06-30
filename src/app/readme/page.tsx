'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReadmePage() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/login'); return }
      return r.json()
    }).then(d => d && setUser(d))
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-base md:text-lg font-bold tracking-wide">📖 Manual Book</h1>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden md:inline text-sm text-gray-300">{user?.name} ({user?.role})</span>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="text-xs md:text-sm bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-600 transition">☰ Menu</button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl min-w-[140px] py-1 z-50">
                  <button onClick={() => { setShowMenu(false); router.push('/pos') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🏠 Main</button>
                  {user?.role === 'admin' && (
                    <>
                      <button onClick={() => { setShowMenu(false); router.push('/admin') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">⚙️ Master Jasa</button>
                      <button onClick={() => { setShowMenu(false); router.push('/admin/discounts') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🏷️ Diskon</button>
                      <button onClick={() => { setShowMenu(false); router.push('/admin/loyalty') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🎁 Loyalty</button>
                      <button onClick={() => { setShowMenu(false); router.push('/users') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">👥 Users</button>
                      <button onClick={() => { setShowMenu(false); router.push('/pembukuan') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">📊 Report</button>
                    </>
                  )}
                  <button onClick={() => { setShowMenu(false); router.push('/transaksi') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🧾 Transaksi</button>
                  <div className="border-t border-gray-700 my-1" />
                  <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }} className="w-full text-left text-sm px-4 py-2 text-red-400 hover:bg-gray-700 transition">🚪 Logout</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 text-gray-700 text-sm leading-relaxed">

          <div className="text-center pb-4 mb-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800">Ayunda Beauty Studio</h2>
            <p className="text-gray-500 mt-1">Point of Sale — Manual Book</p>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 [&>section]:break-inside-avoid [&>section]:mb-6">

          {/* Login */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-2">🔐 Login</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Buka website, masukkan <strong>Username</strong> dan <strong>Password</strong></li>
              <li>Klik <strong>Masuk</strong></li>
              <li>Ada 2 role: <strong>Admin</strong> (akses penuh) dan <strong>Kasir</strong> (transaksi saja)</li>
            </ul>
          </section>

          {/* POS / Transaksi */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-2">🛒 Halaman POS (Kasir)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Klik <strong>item service</strong> untuk menambahkan ke keranjang</li>
              <li>Gunakan tombol <strong>+</strong> dan <strong>-</strong> untuk mengubah jumlah</li>
              <li>Klik <strong>✕</strong> untuk menghapus item dari keranjang</li>
              <li>Klik <strong>Bayar</strong> → pilih metode (Cash/Transfer/QRIS)</li>
              <li>Masukkan jumlah bayar → klik <strong>Konfirmasi</strong></li>
              <li>Struk akan muncul — bisa di-print atau tutup</li>
              <li><strong>Data Pelanggan (opsional):</strong> isi No HP &amp; Nama sebelum bayar untuk ikut program loyalty</li>
            </ul>
            <div className="mt-2 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
              💡 <strong>Tips:</strong> Di HP, klik icon 🛒 di kanan bawah untuk buka keranjang
            </div>
          </section>

          {/* Diskon */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-2">🏷️ Diskon</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Diskon otomatis terpasang jika ada diskon aktif</li>
              <li>Badge merah <span className="bg-red-500 text-white text-xs px-1 rounded">-20%</span> muncul di card item</li>
              <li>Harga asli dicoret, harga diskon ditampilkan</li>
              <li>Diskon bisa <strong>stack</strong> (level kategori + level item dijumlahkan)</li>
              <li>Harga final dihitung ulang oleh server saat checkout (selalu akurat)</li>
            </ul>
          </section>

          {/* Loyalty Reward */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-2">🎁 Loyalty Reward</h3>
            <p>Pelanggan yang sering datang bisa dapat <strong>treatment gratis</strong>. Cara kerjanya:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Kasir isi <strong>No HP</strong> pelanggan di kolom Data Pelanggan saat transaksi</li>
              <li>Sistem menghitung jumlah transaksi pelanggan dalam periode tertentu</li>
              <li>Jika sudah mencapai target (mis. <strong>10x dalam 30 hari</strong>), reward <strong>ter-unlock</strong> otomatis</li>
              <li>Saat pelanggan datang lagi, muncul <strong>banner reward</strong> → kasir klik <strong>Klaim Sekarang</strong> → treatment gratis masuk keranjang (harga 0)</li>
              <li>Klik <strong>Nanti Saja</strong> jika belum mau klaim — reward tersimpan sampai batas waktu klaim</li>
              <li>Reward punya <strong>batas waktu klaim</strong> (mis. 60 hari). Lewat itu, reward hangus</li>
              <li>Item reward ditandai badge <span className="bg-yellow-100 text-yellow-700 text-xs px-1 rounded font-bold">🎁 REWARD</span> dan <strong>GRATIS</strong> di Transaksi &amp; Report</li>
            </ul>
            <div className="mt-2 p-3 bg-yellow-50 rounded-xl text-xs text-yellow-800">
              💡 <strong>Catatan:</strong> Program loyalty harus diaktifkan dulu oleh admin di menu <strong>🎁 Loyalty</strong>.
            </div>
          </section>

          {/* Admin - Loyalty */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-2">🎁 Admin — Loyalty</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Jumlah Transaksi Minimum:</strong> berapa kali transaksi untuk dapat reward</li>
              <li><strong>Rentang Hari (Window):</strong> transaksi dihitung dalam X hari terakhir</li>
              <li><strong>Batas Waktu Klaim:</strong> berapa hari reward berlaku setelah ter-unlock</li>
              <li><strong>Treatment Gratis:</strong> pilih treatment reward, atau kosongkan agar kasir bebas pilih</li>
              <li><strong>Aktif/Nonaktif:</strong> centang toggle untuk mengaktifkan program → Simpan Konfigurasi</li>
            </ul>
          </section>

          {/* Transaksi */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-2">🧾 Halaman Transaksi</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Menampilkan transaksi <strong>hari ini</strong> berdasarkan user yang login</li>
              <li>Filter: All Status / Success Only / Cancel Only</li>
              <li>Klik transaksi untuk lihat detail item</li>
              <li>Klik <strong>Cancel</strong> untuk membatalkan transaksi</li>
            </ul>
          </section>

          {/* Cancel Transaksi */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-2">❌ Cancel Transaksi</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Kasir:</strong> Harus isi Username & Password Admin + Alasan cancel</li>
              <li><strong>Admin:</strong> Cukup isi Alasan cancel saja</li>
              <li>Transaksi yang di-cancel tercatat: siapa yang cancel, siapa yang approve, kapan, dan alasannya</li>
              <li>Hanya transaksi <strong>hari ini</strong> yang bisa di-cancel</li>
            </ul>
          </section>

          {/* Menu (Hamburger) */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-2">☰ Menu</h3>
            <p>Klik tombol <strong>☰ Menu</strong> di kanan atas untuk akses:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li><strong>⚙️ Master Jasa</strong> — Kelola jasa, kategori, QRIS, branding (admin only)</li>
              <li><strong>🏷️ Diskon</strong> — Kelola diskon (admin only)</li>
              <li><strong>🎁 Loyalty</strong> — Konfigurasi program reward (admin only)</li>
              <li><strong>👥 Users</strong> — Kelola user (admin only)</li>
              <li><strong>📊 Report</strong> — Laporan pendapatan (admin only)</li>
              <li><strong>🧾 Transaksi</strong> — Lihat transaksi hari ini</li>
              <li><strong>📖 Readme</strong> — Manual book ini</li>
              <li><strong>🚪 Logout</strong> — Keluar</li>
            </ul>
          </section>

          {/* Admin - Master Jasa */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-2">⚙️ Master Jasa</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Tambah Jasa:</strong> Isi nama, harga, pilih kategori → Simpan</li>
              <li><strong>Edit Jasa:</strong> Klik Edit di daftar → ubah → Update</li>
              <li><strong>Hapus Jasa:</strong> Klik Hapus di daftar</li>
              <li><strong>Tambah Kategori:</strong> Isi nama → Tambah</li>
              <li><strong>Edit/Hapus Kategori:</strong> Klik Edit atau Hapus di list</li>
              <li><strong>QRIS:</strong> Masukkan Merchant ID/URL → Simpan</li>
              <li><strong>Tampilan / Branding:</strong> ubah <strong>Nama Studio</strong> (judul header &amp; struk) dan <strong>Logo/Gambar tengah POS</strong> (upload gambar, maks 1.5 MB)</li>
            </ul>
          </section>

          {/* Admin - Diskon */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-2">🏷️ Admin — Diskon</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Level:</strong> Per Item (Service) atau Per Kategori</li>
              <li><strong>Tanggal:</strong> Set periode diskon (Dari — Sampai)</li>
              <li><strong>Validasi:</strong> Tanggal awal tidak boleh &gt; tanggal akhir</li>
              <li><strong>Overlap:</strong> Tidak boleh ada 2 diskon untuk item/kategori yang sama di periode yang sama</li>
              <li><strong>On/Off:</strong> Klik untuk aktifkan/nonaktifkan tanpa hapus</li>
              <li><strong>Stack:</strong> Diskon kategori + diskon item dijumlahkan (max 100%)</li>
            </ul>
          </section>

          {/* Report */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-2">📊 Report (Admin Only)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Filter berdasarkan <strong>tanggal</strong> (Dari — Sampai)</li>
              <li>Filter metode: Semua / Cash / Cashless</li>
              <li>Filter status: All / Success Only / Cancel Only</li>
              <li>Summary: Total Transaksi, Cash, Cashless, Cancelled</li>
              <li>Klik row untuk lihat detail (item, diskon, payment, cancel info)</li>
            </ul>
          </section>

          {/* Users */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-2">👥 User Management (Admin Only)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Add User:</strong> Isi username, password, nama, role → Add</li>
              <li><strong>Edit User:</strong> Klik Edit → ubah data → Update</li>
              <li><strong>Delete User:</strong> Klik Delete (tidak bisa hapus akun sendiri)</li>
              <li><strong>Role:</strong> Admin (akses penuh) atau Kasir (transaksi + transaksi history)</li>
            </ul>
          </section>

          </div>

          {/* Footer */}
          <div className="text-center pt-4 mt-2 border-t border-gray-100">
            <p className="text-gray-400 text-xs">© 2026 Ayunda Beauty Studio — POS System</p>
          </div>
        </div>
      </div>
    </div>
  )
}
