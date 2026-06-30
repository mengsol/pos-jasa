// ============================================================
// PERUBAHAN DI: src/app/pos/page.tsx
// ============================================================
//
// 1. Tambah state baru (setelah state discounts):
//

// --- Customer & Loyalty states ---
const [customerPhone, setCustomerPhone] = useState('')
const [customerName, setCustomerName] = useState('')
const [customer, setCustomer] = useState<{ id: string; name: string; phone: string } | null>(null)
const [loyaltyInfo, setLoyaltyInfo] = useState<{
  eligible: boolean; hasUnclaimedReward: boolean; pendingRewardId?: string;
  transactionCount: number; required: number; remaining: number;
  expiresAt?: string; claimDaysLimit: number;
  rewardService: { id: string; name: string; price: number } | null
} | null>(null)
const [showRewardBanner, setShowRewardBanner] = useState(false)
const [rewardClaimed, setRewardClaimed] = useState(false)

//
// 2. Tambah function untuk search customer (setelah function addToCart):
//

async function searchCustomer() {
  if (!customerPhone || customerPhone.length < 8) return
  const res = await fetch(`/api/customers?phone=${customerPhone}`)
  const data = await res.json()
  if (data && data.id) {
    setCustomer(data)
    setCustomerName(data.name)
    // Check loyalty eligibility
    checkLoyalty(data.id)
  } else {
    setCustomer(null)
    setLoyaltyInfo(null)
  }
}

async function checkLoyalty(customerId: string) {
  const res = await fetch(`/api/loyalty/check?customerId=${customerId}`)
  const data = await res.json()
  setLoyaltyInfo(data)
  if (data.eligible && data.hasUnclaimedReward) {
    setShowRewardBanner(true)
  }
}

async function saveCustomerAndPay() {
  // If customer doesn't exist yet, create
  let custId = customer?.id
  if (!custId && customerPhone && customerName) {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: customerName, phone: customerPhone }),
    })
    const data = await res.json()
    custId = data.id
    setCustomer(data)
  }
  return custId || null
}

async function claimReward(transactionId: string) {
  if (!loyaltyInfo?.pendingRewardId) return
  await fetch('/api/loyalty/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pendingRewardId: loyaltyInfo.pendingRewardId,
      transactionId,
    }),
  })
  setRewardClaimed(true)
  setShowRewardBanner(false)
}

//
// 3. Modifikasi handlePay — tambah customerId ke body:
//

async function handlePay() {
  const amount = parseFloat(payAmount) || total
  setPayLoading(true)

  // Save/get customer first
  const custId = await saveCustomerAndPay()

  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: cart,
      payments: [{ method: payMethod, amount }],
      customerId: custId, // <-- TAMBAHAN
    }),
  })
  const data = await res.json()
  setPayLoading(false)
  if (res.ok) {
    // If reward was claimed (item gratis sudah di cart), record the claim
    if (rewardClaimed && loyaltyInfo?.pendingRewardId) {
      await claimReward(data.id)
    }

    setReceipt({
      invoiceNo: data.invoiceNo, items: cart,
      payments: [{ method: payMethod, amount }],
      totalAmount: total,
      createdAt: new Date().toLocaleString('id-ID'),
      cashierName: user?.name || '',
    })
    setCart([]); setShowPay(false); setPayAmount('')
    // Reset customer state
    setCustomerPhone(''); setCustomerName(''); setCustomer(null)
    setLoyaltyInfo(null); setShowRewardBanner(false); setRewardClaimed(false)
  }
}

//
// 4. Tambah UI input pelanggan — SEBELUM tombol "Bayar" di cart section:
//    (baik di desktop cart maupun mobile cart)
//

/* --- Customer Input Section (taruh di atas tombol Bayar) --- */
/*
<div className="px-4 py-3 border-t bg-gray-50 space-y-2">
  <p className="text-xs font-semibold text-gray-500 uppercase">Data Pelanggan (opsional)</p>
  <div className="flex gap-2">
    <input
      type="tel"
      placeholder="No HP"
      value={customerPhone}
      onChange={e => setCustomerPhone(e.target.value)}
      onBlur={searchCustomer}
      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900"
    />
    <button onClick={searchCustomer} className="px-3 py-2 bg-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-300">Cari</button>
  </div>
  <input
    type="text"
    placeholder="Nama Pelanggan"
    value={customerName}
    onChange={e => setCustomerName(e.target.value)}
    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900"
  />
  {customer && (
    <p className="text-xs text-green-600">✓ Pelanggan ditemukan: {customer.name}</p>
  )}
  {loyaltyInfo && !loyaltyInfo.eligible && loyaltyInfo.remaining > 0 && (
    <p className="text-xs text-blue-600">
      🎯 {loyaltyInfo.remaining} transaksi lagi untuk reward gratis!
    </p>
  )}
  {loyaltyInfo?.eligible && loyaltyInfo.expiresAt && (
    <p className="text-xs text-orange-600">
      🎁 Reward tersedia! Berlaku sampai {new Date(loyaltyInfo.expiresAt).toLocaleDateString('id-ID')}
    </p>
  )}
</div>
*/

//
// 5. Reward Banner — tampilkan saat eligible (taruh sebelum receipt modal):
//

/*
{showRewardBanner && loyaltyInfo?.eligible && loyaltyInfo.hasUnclaimedReward && (
  <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-4 rounded-2xl shadow-2xl max-w-sm text-center animate-bounce">
    <p className="text-lg font-bold">🎉 SELAMAT!</p>
    <p className="text-sm mt-1">
      Pelanggan ini sudah {loyaltyInfo.transactionCount}x transaksi!
    </p>
    <p className="text-sm font-semibold mt-1">
      Berhak mendapat 1 treatment GRATIS
      {loyaltyInfo.rewardService && `: ${loyaltyInfo.rewardService.name}`}
    </p>
    {loyaltyInfo.expiresAt && (
      <p className="text-xs mt-1 opacity-80">
        Berlaku sampai: {new Date(loyaltyInfo.expiresAt).toLocaleDateString('id-ID')}
      </p>
    )}
    <div className="flex gap-2 mt-3 justify-center">
      <button
        onClick={() => {
          // Add reward item to cart with price 0
          if (loyaltyInfo.rewardService) {
            setCart(prev => [...prev, {
              serviceId: loyaltyInfo.rewardService!.id,
              serviceName: `🎁 ${loyaltyInfo.rewardService!.name} (REWARD)`,
              qty: 1, price: 0, originalPrice: loyaltyInfo.rewardService!.price,
              discountPercent: 100, subtotal: 0,
            }])
          }
          setShowRewardBanner(false)
          setRewardClaimed(true)
        }}
        className="bg-white text-orange-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-50"
      >
        Klaim Sekarang
      </button>
      <button
        onClick={() => setShowRewardBanner(false)}
        className="bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/40"
      >
        Nanti Saja
      </button>
    </div>
  </div>
)}
*/
