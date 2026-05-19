'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'

interface Service {
  id: string; name: string; price: number
  categoryId?: string | null
  category?: {
    id: string; name: string; parentId?: string | null;
    parent?: { id: string; name: string; parentId?: string | null; parent?: { id: string; name: string } | null } | null
  } | null
}
interface CartItem {
  serviceId: string; serviceName: string; qty: number; price: number; originalPrice: number; discountPercent: number; subtotal: number
}
interface Discount {
  id: string; type: string; targetId: string; discountPercent: number
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
  const [showCart, setShowCart] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [discountsLoaded, setDiscountsLoaded] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Parallel fetch for faster loading
    const authPromise = fetch('/api/auth/me')
    const servicesPromise = fetch('/api/services')
    const settingsPromise = fetch('/api/settings')
    const discountsPromise = fetch('/api/discounts/active')

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

    discountsPromise.then(r => r.json()).then(data => {
      if (Array.isArray(data)) setDiscounts(data)
      setDiscountsLoaded(true)
    }).catch(() => setDiscountsLoaded(true))

    // Show cached services immediately
    const cachedServices = sessionStorage.getItem('pos-services')
    if (cachedServices) {
      try { setServices(JSON.parse(cachedServices)) } catch {}
    }
  }, [router])

  useEffect(() => {
    if (payMethod === 'qris' && qrisUrl) {
      QRCode.toDataURL(qrisUrl, { width: 200, margin: 1 }).then(setQrisDataUrl)
    }
  }, [payMethod, qrisUrl])

  const total = cart.reduce((s, i) => s + i.subtotal, 0)

  // Expandable parent categories
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())

  function toggleParent(id: string) {
    setExpandedParents(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Build category tree from services (3 levels: parent > child > grandchild)
  interface TreeNode {
    name: string
    children: Record<string, { name: string; grandchildren: Record<string, { name: string; services: Service[] }>; services: Service[] }>
    directServices: Service[]
  }
  const categoryTree = services.reduce<Record<string, TreeNode>>((acc, svc) => {
    const cat = svc.category
    if (!cat) return acc

    // Determine hierarchy: find root parent
    const lvl1 = cat.parent?.parent || cat.parent // grandparent or parent
    const lvl2 = cat.parent?.parent ? cat.parent : (cat.parentId ? cat : null) // parent (if 3 levels) or cat itself (if 2 levels)
    const lvl3 = cat.parent?.parent ? cat : null // cat itself is grandchild (3 levels)

    if (lvl1 && lvl2 && lvl3) {
      // 3 levels: service under grandchild
      if (!acc[lvl1.id]) acc[lvl1.id] = { name: lvl1.name, children: {}, directServices: [] }
      if (!acc[lvl1.id].children[lvl2.id]) acc[lvl1.id].children[lvl2.id] = { name: lvl2.name, grandchildren: {}, services: [] }
      if (!acc[lvl1.id].children[lvl2.id].grandchildren[lvl3.id]) acc[lvl1.id].children[lvl2.id].grandchildren[lvl3.id] = { name: lvl3.name, services: [] }
      acc[lvl1.id].children[lvl2.id].grandchildren[lvl3.id].services.push(svc)
    } else if (cat.parent && cat.parentId) {
      // 2 levels: service under child
      const parentId = cat.parent.id
      if (!acc[parentId]) acc[parentId] = { name: cat.parent.name, children: {}, directServices: [] }
      if (!acc[parentId].children[cat.id]) acc[parentId].children[cat.id] = { name: cat.name, grandchildren: {}, services: [] }
      acc[parentId].children[cat.id].services.push(svc)
    } else {
      // 1 level: service directly under parent
      if (!acc[cat.id]) acc[cat.id] = { name: cat.name, children: {}, directServices: [] }
      acc[cat.id].directServices.push(svc)
    }
    return acc
  }, {})

  // Filter by search
  const searchLower = search.toLowerCase()
  const hasSearch = search.length > 0

  function getDiscountForService(svc: Service): number {
    let totalDiscount = 0
    // Check item-level discount
    const itemDiscount = discounts.find(d => d.type === 'service' && d.targetId === svc.id)
    if (itemDiscount) totalDiscount += itemDiscount.discountPercent
    // Check category-level discount (stacks with item)
    if (svc.categoryId) {
      const catDiscount = discounts.find(d => d.type === 'category' && d.targetId === svc.categoryId)
      if (catDiscount) totalDiscount += catDiscount.discountPercent
    }
    return Math.min(totalDiscount, 100) // cap at 100%
  }

  function addToCart(svc: Service) {
    const discPct = getDiscountForService(svc)
    const discountedPrice = discPct > 0 ? Math.round(svc.price * (1 - discPct / 100)) : svc.price

    setCart(prev => {
      const existing = prev.find(i => i.serviceId === svc.id)
      if (existing) {
        return prev.map(i => i.serviceId === svc.id
          ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.price } : i)
      }
      return [...prev, { serviceId: svc.id, serviceName: svc.name, qty: 1, price: discountedPrice, originalPrice: svc.price, discountPercent: discPct, subtotal: discountedPrice }]
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
    setPayLoading(true)
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,
        payments: [{ method: payMethod, amount }],
      }),
    })
    const data = await res.json()
    setPayLoading(false)
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
  .watermark {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 0;
  }
  .watermark img {
    width: 50mm;
    height: 50mm;
    object-fit: contain;
    opacity: 0.15;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .content { position: relative; z-index: 1; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 3px 0; }
  .sm { font-size: 9px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 0; vertical-align: top; }
</style></head><body><div class="watermark"><img src="/bg2.jpg" /></div><div class="content">${receiptRef.current.innerHTML}</div></body></html>`)
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
        <h1 className="text-base md:text-lg font-bold tracking-wide">Ayunda Beauty Studio</h1>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden md:inline text-sm text-gray-300">{user?.name} ({user?.role})</span>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="text-sm bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-600 transition">☰ Menu</button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl min-w-[140px] py-1 z-50">
              {user?.role === 'admin' && (
                <>
                  <button onClick={() => { setShowMenu(false); router.push('/admin') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">⚙️ Admin</button>
                  <button onClick={() => { setShowMenu(false); router.push('/admin/discounts') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🏷️ Diskon</button>
                  <button onClick={() => { setShowMenu(false); router.push('/users') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">👥 Users</button>
                  <button onClick={() => { setShowMenu(false); router.push('/pembukuan') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">📊 Report</button>
                </>
              )}
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

      <div className="flex h-[calc(100vh-52px)]">
        {/* Left: Service list */}
        <div className="flex-1 p-3 md:p-4 overflow-y-auto flex flex-col">
          <input type="text" placeholder="Cari jasa..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-3 text-gray-900 bg-white text-sm focus:outline-none focus:border-gray-400 transition" />

          <div className="flex-1 md:bg-[url('/bg.jpeg')] md:bg-contain md:bg-top md:bg-no-repeat rounded-lg p-3">
            {!discountsLoaded ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-gray-400 text-sm">Memuat data...</p>
              </div>
            ) : hasSearch ? (
              /* Search mode: flat grid */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {services.filter(s => s.name.toLowerCase().includes(searchLower)).map(svc => (
                  <button key={svc.id} onClick={() => addToCart(svc)}
                    className="bg-white/75 backdrop-blur-sm p-4 rounded-2xl shadow-md hover:shadow-lg hover:bg-white/90 transition-all duration-200 text-left border border-white/50 relative">
                    {getDiscountForService(svc) > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-lg">-{getDiscountForService(svc)}%</span>
                    )}
                    <p className="font-bold text-gray-900 text-sm">{svc.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{svc.category?.name}</p>
                    {getDiscountForService(svc) > 0 ? (
                      <div className="mt-1">
                        <p className="text-gray-400 line-through text-xs">{fmt(svc.price)}</p>
                        <p className="text-red-600 font-bold text-base">{fmt(Math.round(svc.price * (1 - getDiscountForService(svc) / 100)))}</p>
                      </div>
                    ) : (
                      <p className="text-gray-800 font-bold mt-1 text-base">{fmt(svc.price)}</p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              /* Tree view: parent cards with expandable children */
              <div className="space-y-3">
                {Object.entries(categoryTree).sort(([,a], [,b]) => a.name.localeCompare(b.name)).map(([parentId, parent]) => {
                  const isExpanded = expandedParents.has(parentId)
                  const childEntries = Object.entries(parent.children).sort(([,a], [,b]) => a.name.localeCompare(b.name))
                  const hasContent = childEntries.length > 0 || parent.directServices.length > 0

                  return (
                    <div key={parentId} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/50 overflow-hidden">
                      {/* Parent header — click to expand */}
                      <button onClick={() => toggleParent(parentId)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition">
                        <span className="font-bold text-gray-800 text-sm md:text-base">📁 {parent.name}</span>
                        <span className="text-gray-400 text-lg">{isExpanded ? '▼' : '▶'}</span>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && hasContent && (
                        <div className="px-4 pb-4 space-y-3">
                          {/* Child categories (level 2) */}
                          {childEntries.map(([childId, child]) => (
                            <div key={childId}>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">{child.name}</p>

                              {/* Grandchild categories (level 3) */}
                              {Object.entries(child.grandchildren).sort(([,a], [,b]) => a.name.localeCompare(b.name)).map(([gcId, gc]) => (
                                <div key={gcId} className="ml-2 mb-2">
                                  <p className="text-xs font-medium text-gray-600 mb-1 pl-1 italic">• {gc.name}</p>
                                  <div className="space-y-1 ml-2">
                                    {gc.services.map(svc => (
                                      <button key={svc.id} onClick={() => addToCart(svc)}
                                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition text-left relative">
                                        {getDiscountForService(svc) > 0 && (
                                          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded">-{getDiscountForService(svc)}%</span>
                                        )}
                                        <span className="text-sm text-gray-800">{svc.name}</span>
                                        {getDiscountForService(svc) > 0 ? (
                                          <div className="text-right">
                                            <span className="text-xs text-gray-400 line-through mr-1">{fmt(svc.price)}</span>
                                            <span className="text-sm font-bold text-red-600">{fmt(Math.round(svc.price * (1 - getDiscountForService(svc) / 100)))}</span>
                                          </div>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-800">{fmt(svc.price)}</span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}

                              {/* Services directly under child (level 2) */}
                              {child.services.length > 0 && (
                                <div className="space-y-1">
                                  {child.services.map(svc => (
                                    <button key={svc.id} onClick={() => addToCart(svc)}
                                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition text-left relative">
                                      {getDiscountForService(svc) > 0 && (
                                        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded">-{getDiscountForService(svc)}%</span>
                                      )}
                                      <span className="text-sm text-gray-800">{svc.name}</span>
                                      {getDiscountForService(svc) > 0 ? (
                                        <div className="text-right">
                                          <span className="text-xs text-gray-400 line-through mr-1">{fmt(svc.price)}</span>
                                          <span className="text-sm font-bold text-red-600">{fmt(Math.round(svc.price * (1 - getDiscountForService(svc) / 100)))}</span>
                                        </div>
                                      ) : (
                                        <span className="text-sm font-bold text-gray-800">{fmt(svc.price)}</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Direct services (no subcategory) */}
                          {parent.directServices.length > 0 && (
                            <div>
                              {childEntries.length > 0 && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">Lainnya</p>}
                              <div className="space-y-1">
                                {parent.directServices.map(svc => (
                                  <button key={svc.id} onClick={() => addToCart(svc)}
                                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition text-left relative">
                                    {getDiscountForService(svc) > 0 && (
                                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded">-{getDiscountForService(svc)}%</span>
                                    )}
                                    <span className="text-sm text-gray-800">{svc.name}</span>
                                    {getDiscountForService(svc) > 0 ? (
                                      <div className="text-right">
                                        <span className="text-xs text-gray-400 line-through mr-1">{fmt(svc.price)}</span>
                                        <span className="text-sm font-bold text-red-600">{fmt(Math.round(svc.price * (1 - getDiscountForService(svc) / 100)))}</span>
                                      </div>
                                    ) : (
                                      <span className="text-sm font-bold text-gray-800">{fmt(svc.price)}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart - desktop only */}
        <div className="hidden md:flex w-96 bg-gradient-to-b from-gray-50 to-white border-l flex-col">
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

      {/* Mobile: Floating cart button */}
      <button
        onClick={() => setShowCart(true)}
        className="md:hidden fixed bottom-4 right-4 z-40 bg-gray-800 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg active:scale-95 transition"
      >
        <span className="text-xl">🛒</span>
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cart.reduce((s, i) => s + i.qty, 0)}
          </span>
        )}
      </button>

      {/* Mobile: Cart slide-up panel */}
      {showCart && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80dvh] flex flex-col shadow-2xl">
            <div className="flex justify-center pt-2 pb-1">
              <button onClick={() => setShowCart(false)} className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            <div className="p-4 border-b bg-white">
              <h2 className="font-bold text-gray-800 text-lg">🛒 Keranjang</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cart.length === 0 && <p className="text-gray-400 text-center mt-8 text-sm">Belum ada item</p>}
              {cart.map(item => (
                <div key={item.serviceId} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{item.serviceName}</p>
                    <p className="text-xs text-gray-400">{fmt(item.price)} / item</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.serviceId, item.qty - 1)} className="w-7 h-7 bg-gray-200 rounded-full text-gray-600 font-bold">-</button>
                    <span className="text-sm w-5 text-center font-semibold">{item.qty}</span>
                    <button onClick={() => updateQty(item.serviceId, item.qty + 1)} className="w-7 h-7 bg-gray-800 rounded-full text-white font-bold">+</button>
                    <span className="text-sm font-bold w-16 text-right">{fmt(item.subtotal)}</span>
                    <button onClick={() => removeFromCart(item.serviceId)} className="text-red-400 text-sm ml-1">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t space-y-3">
              <div className="flex justify-between text-lg font-bold text-gray-800">
                <span>Total</span><span>{fmt(total)}</span>
              </div>
              <button onClick={() => { setShowCart(false); setShowPay(true) }} disabled={cart.length === 0}
                className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold disabled:opacity-40 transition">Bayar</button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay saat proses pembayaran */}
      {payLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl text-center">
            <div className="animate-spin w-8 h-8 border-3 border-gray-300 border-t-gray-800 rounded-full mx-auto mb-3"></div>
            <p className="text-gray-800 font-medium text-sm">Memproses pembayaran...</p>
            <p className="text-gray-400 text-xs mt-1">Please wait</p>
          </div>
        </div>
      )}

      {/* Receipt Modal — Thermal format */}
      {receipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 bg-[url('/bg2.jpg')] bg-contain bg-center bg-no-repeat opacity-20 pointer-events-none"
            />
            <div className="relative text-black">
            <div ref={receiptRef}>
              <div className="center bold" style={{fontSize:'14px', color:'#000'}}>AYUNDA BEAUTY STUDIO</div>
              <div className="center sm" style={{color:'#333'}}>{receipt.createdAt}</div>
              <div className="line" />
              <div className="sm" style={{color:'#000'}}>No : {receipt.invoiceNo}</div>
              <div className="sm" style={{color:'#000'}}>Kasir: {receipt.cashierName}</div>
              <div className="line" />
              <table>
                <tbody>
                  {receipt.items.map((item, i) => (
                    <tr key={i}>
                      <td style={{fontSize:'10px', color:'#000', paddingBottom:'2px'}} colSpan={2}>
                        <div>{item.serviceName}</div>
                        <div style={{paddingLeft:'8px'}}>
                          {item.qty} x {fmt(item.originalPrice)}
                          {item.discountPercent > 0 && (
                            <span style={{color:'#dc2626'}}> (disc {item.discountPercent}%)</span>
                          )}
                          <span style={{float:'right'}}>{fmt(item.subtotal)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {receipt.items.some(i => i.discountPercent > 0) && (
                    <tr>
                      <td colSpan={2} style={{fontSize:'9px', color:'#666', paddingTop:'2px'}}>
                        * Harga sudah termasuk diskon
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="line" />
              <table>
                <tbody>
                  <tr><td className="bold" style={{color:'#000'}}>TOTAL</td><td className="right bold" style={{color:'#000'}}>{fmt(receipt.totalAmount)}</td></tr>
                  {receipt.payments.map((p, i) => (
                    <tr key={i}><td className="sm" style={{color:'#000'}}>{p.method.toUpperCase()}</td><td className="right sm" style={{color:'#000'}}>{fmt(p.amount)}</td></tr>
                  ))}
                  {receipt.payments[0]?.method === 'cash' && receipt.payments[0].amount > receipt.totalAmount && (
                    <tr><td className="sm" style={{color:'#000'}}>KEMBALIAN</td><td className="right sm" style={{color:'#000'}}>{fmt(receipt.payments[0].amount - receipt.totalAmount)}</td></tr>
                  )}
                </tbody>
              </table>
              <div className="line" />
              <div className="center sm" style={{color:'#333'}}>Terima kasih!</div>
              </div>
            <div className="flex gap-2 mt-4">
              <button onClick={printReceipt} className="flex-1 bg-gray-800 text-white py-2 rounded-xl font-bold">Print Struk</button>
              <button onClick={() => setReceipt(null)} className="flex-1 bg-gray-200 py-2 rounded-xl text-gray-700 font-medium">Tutup</button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
