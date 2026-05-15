'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'

interface Service {
  id: string; name: string; price: number
  category?: { name: string } | null
}
interface CartItem {
  serviceId: string; serviceName: string; qty: number; price: number; subtotal: number
}
interface ReceiptData {
  invoiceNo: string; items: CartItem[]; payments: { method: string; amount: number }[]
  totalAmount: number; createdAt: string; cashierName: string
}

export default function POSPage() {
  const [services, setServices] = useState<Service[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payAmount, setPayAmount] = useState('')
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [showPay, setShowPay] = useState(false)
  const [qrisUrl, setQrisUrl] = useState('')
  const [qrisDataUrl, setQrisDataUrl] = useState('')
  const receiptRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Parallel fetch for faster loading
    const authPromise = fetch('/api/auth/me')
    const servicesPromise = fetch('/api/services')
    const settingsPromise = fetch('/api/settings')

    authPromise.then(r => {
      if (!r.ok) { router.push('/login'); return }
      return r.json()
    }).then(d => d && setUser(d))

    servicesPromise.then(r => r.json()).then(data => {
      setServices(data)
      sessionStorage.setItem('pos-services', JSON.stringify(data))
    })

    settingsPromise.then(r => r.json()).then(s => {
      if (s.qris_merchant_id) setQrisUrl(s.qris_merchant_id)
    })

    // Show cached services immediately while fetching fresh data
    const cached = sessionStorage.getItem('pos-services')
    if (cached) {
      try { setServices(JSON.parse(cached)) } catch {}
    }
  }, [router])

  useEffect(() => {
    if (payMethod === 'qris' && qrisUrl) {
      QRCode.toDataURL(qrisUrl, { width: 200, margin: 1 }).then(setQrisDataUrl)
    }
  }, [payMethod, qrisUrl])

  const total = cart.reduce((s, i) => s + i.subtotal, 0)
  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  function addToCart(svc: Service) {
    setCart(prev => {
      const existing = prev.find(i => i.serviceId === svc.id)
      if (existing) {
        return prev.map(i => i.serviceId === svc.id
          ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.price } : i)
      }
      return [...prev, { serviceId: svc.id, serviceName: svc.name, qty: 1, price: svc.price, subtotal: svc.price }]
    })
  }

  function removeFromCart(serviceId: string) {
    setCart(prev => prev.filter(i => i.serviceId !== serviceId))
  }

  function updateQty(serviceId: string, qty: number) {
    if (qty <= 0) { removeFromCart(serviceId); return }
    setCart(prev => prev.map(i => i.serviceId === serviceId
      ? { ...i, qty, subtotal: qty * i.price } : i))
  }

  async function handlePay() {
    const amount = parseFloat(payAmount) || total
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,
        payments: [{ method: payMethod, amount }],
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setReceipt({
        invoiceNo: data.invoiceNo, items: cart,
        payments: [{ method: payMethod, amount }],
        totalAmount: total,
        createdAt: new Date().toLocaleString('id-ID'),
        cashierName: user?.name || '',
      })
      setCart([]); setShowPay(false); setPayAmount('')
    }
  }

  function printReceipt() {
    if (!receiptRef.current) return
    const pw = window.open('', '_blank', 'width=302,height=600')
    if (!pw) return
    pw.document.write(`<html><head><title>Struk</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  body {
    font-family: 'Courier New', monospace; font-size: 11px;
    width: 72mm; margin: 0 auto; padding: 2mm; line-height: 1.4;
    position: relative;
  }
  body::before {
    content: "";
    position: fixed; inset: 0;
    background: url('/bg2.jpg') no-repeat center center;
    background-size: contain;
    opacity: 0.5;
    z-index: -1;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 3px 0; }
  .sm { font-size: 9px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 0; vertical-align: top; }
</style></head><body>${receiptRef.current.innerHTML}</body></html>`)
    pw.document.close()
    setTimeout(() => { pw.print(); pw.close() }, 300)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold tracking-wide">Ayunda Beauty Studio</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">{user?.name} ({user?.role})</span>
          <div className="relative group">
            <button className="text-sm bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-600 transition">☰ Menu</button>
            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[140px] py-1 z-50">
              {user?.role === 'admin' && (
                <>
                  <button onClick={() => router.push('/admin')} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">⚙️ Admin</button>
                  <button onClick={() => router.push('/users')} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">👥 Users</button>
                  <button onClick={() => router.push('/pembukuan')} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">📊 Report</button>
                </>
              )}
              <button onClick={() => router.push('/transaksi')} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🧾 Transaksi</button>
              <div className="border-t border-gray-700 my-1" />
              <button onClick={handleLogout} className="w-full text-left text-sm px-4 py-2 text-red-400 hover:bg-gray-700 transition">🚪 Logout</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-52px)]">
        {/* Left: Service list */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col">
          <input type="text" placeholder="Cari jasa..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded-md mb-4 text-gray-900 bg-white" />
          <div className="flex-1 bg-[url('/bg.jpeg')] bg-contain bg-top bg-no-repeat rounded-lg p-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(svc => (
                <button key={svc.id} onClick={() => addToCart(svc)}
                  className="bg-white/75 backdrop-blur-sm p-5 rounded-2xl shadow-md hover:shadow-lg hover:bg-white/90 transition-all duration-200 text-left border border-white/50">
                  <p className="font-bold text-gray-900 text-base">{svc.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{svc.category?.name}</p>
                  <p className="text-gray-800 font-bold mt-2 text-lg">{fmt(svc.price)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-96 bg-gradient-to-b from-gray-50 to-white border-l flex flex-col">
          <div className="p-4 border-b bg-white">
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">🛒 Keranjang</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 && <p className="text-gray-400 text-center mt-16 text-sm">Belum ada item</p>}
            {cart.map(item => (
              <div key={item.serviceId} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{item.serviceName}</p>
                  <p className="text-xs text-gray-400">{fmt(item.price)} / item</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.serviceId, item.qty - 1)} className="w-7 h-7 bg-gray-100 rounded-full text-gray-600 font-bold hover:bg-gray-200 transition">-</button>
                  <span className="text-sm w-6 text-center font-semibold text-gray-800">{item.qty}</span>
                  <button onClick={() => updateQty(item.serviceId, item.qty + 1)} className="w-7 h-7 bg-gray-800 rounded-full text-white font-bold hover:bg-gray-700 transition">+</button>
                  <span className="text-sm font-bold w-20 text-right text-gray-800">{fmt(item.subtotal)}</span>
                  <button onClick={() => removeFromCart(item.serviceId)} className="text-red-400 hover:text-red-600 text-sm ml-1 transition">✕</button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t bg-white space-y-3">
            <div className="flex justify-between text-lg font-bold text-gray-800">
              <span>Total</span><span>{fmt(total)}</span>
            </div>
            {!showPay ? (
              <button onClick={() => setShowPay(true)} disabled={cart.length === 0}
                className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-700 disabled:opacity-40 transition-all duration-200 text-lg">Bayar</button>
            ) : (
              <div className="space-y-2">
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-gray-900">
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer Bank</option>
                  <option value="qris">QRIS</option>
                </select>

                {/* QRIS QR Code */}
                {payMethod === 'qris' && qrisDataUrl && (
                  <div className="text-center py-2">
                    <img src={qrisDataUrl} alt="QRIS" className="mx-auto" width={180} height={180} />
                    <p className="text-xs text-gray-500 mt-1">Scan untuk bayar</p>
                  </div>
                )}
                {payMethod === 'qris' && !qrisUrl && (
                  <p className="text-xs text-red-500 text-center">QRIS belum di-set. Atur di Admin → Settings.</p>
                )}

                <input type="number" placeholder={`Jumlah bayar (min ${fmt(total)})`}
                  value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-gray-900" />
                {payMethod === 'cash' && payAmount && parseFloat(payAmount) > total && (
                  <p className="text-sm text-green-600">Kembalian: {fmt(parseFloat(payAmount) - total)}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowPay(false)} className="flex-1 bg-gray-300 py-2 rounded text-gray-700">Batal</button>
                  <button onClick={handlePay}
                    className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">Konfirmasi</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal — Thermal format */}
      {receipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 bg-[url('/bg2.jpg')] bg-contain bg-center bg-no-repeat opacity-50 pointer-events-none"
            />
            <div className="relative">
            <div ref={receiptRef}>
              <div className="center bold" style={{fontSize:'14px'}}>AYUNDA BEAUTY STUDIO</div>
              <div className="center sm">{receipt.createdAt}</div>
              <div className="line" />
              <div className="sm">No : {receipt.invoiceNo}</div>
              <div className="sm">Kasir: {receipt.cashierName}</div>
              <div className="line" />
              <table>
                <tbody>
                  {receipt.items.map((item, i) => (
                    <tr key={i}>
                      <td colSpan={3} style={{fontSize:'10px'}}>{item.serviceName}</td>
                    </tr>
                  ))}
                  {receipt.items.map((item, i) => (
                    <tr key={'d'+i}>
                      <td style={{fontSize:'10px',paddingLeft:'8px'}}>{item.qty} x {fmt(item.price)}</td>
                      <td className="right" style={{fontSize:'10px'}}>{fmt(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="line" />
              <table>
                <tbody>
                  <tr><td className="bold">TOTAL</td><td className="right bold">{fmt(receipt.totalAmount)}</td></tr>
                  {receipt.payments.map((p, i) => (
                    <tr key={i}><td className="sm">{p.method.toUpperCase()}</td><td className="right sm">{fmt(p.amount)}</td></tr>
                  ))}
                  {receipt.payments[0]?.method === 'cash' && receipt.payments[0].amount > receipt.totalAmount && (
                    <tr><td className="sm">KEMBALIAN</td><td className="right sm">{fmt(receipt.payments[0].amount - receipt.totalAmount)}</td></tr>
                  )}
                </tbody>
              </table>
              <div className="line" />
              <div className="center sm">Terima kasih!</div>
              </div>
            <div className="flex gap-2 mt-4">
              <button onClick={printReceipt} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">Print Struk</button>
              <button onClick={() => setReceipt(null)} className="flex-1 bg-gray-300 py-2 rounded text-gray-700">Tutup</button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
