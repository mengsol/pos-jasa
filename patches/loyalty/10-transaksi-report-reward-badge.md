# Penanda Reward di Halaman Transaksi & Report

## Konsep
Item reward ditandai dengan nama yang diawali "🎁" dan discountPercent = 100.
Kita deteksi ini untuk menampilkan badge "REWARD" agar admin tidak bingung melihat item harga 0.

---

## 1. Halaman Transaksi (src/app/transaksi/page.tsx)

### Perubahan di bagian expanded items (dalam expandedId === t.id):

CARI:
```tsx
{t.items.map((item, i) => (
  <div key={i} className="flex justify-between text-sm text-gray-600">
    <span>
      {item.serviceName} x{item.qty}
      {(item as { discountPercent?: number }).discountPercent ? (
        <span className="text-red-500 text-xs ml-1">(disc {(item as { discountPercent?: number }).discountPercent}%)</span>
      ) : null}
    </span>
    <span>{fmt(item.subtotal)}</span>
  </div>
))}
```

GANTI DENGAN:
```tsx
{t.items.map((item, i) => {
  const isReward = item.serviceName.includes('REWARD') || ((item as { discountPercent?: number }).discountPercent === 100 && item.subtotal === 0)
  return (
    <div key={i} className="flex justify-between text-sm text-gray-600">
      <span>
        {item.serviceName} x{item.qty}
        {isReward ? (
          <span className="ml-1 inline-block px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">🎁 REWARD</span>
        ) : (item as { discountPercent?: number }).discountPercent ? (
          <span className="text-red-500 text-xs ml-1">(disc {(item as { discountPercent?: number }).discountPercent}%)</span>
        ) : null}
      </span>
      <span>{isReward ? <span className="text-yellow-600 font-medium">GRATIS</span> : fmt(item.subtotal)}</span>
    </div>
  )
})}
```

---

## 2. Halaman Report / Pembukuan (src/app/pembukuan/page.tsx)

### Perubahan A: Di kolom "Item" pada tabel (baris ringkasan)

CARI:
```tsx
<td className="text-gray-600 text-xs max-w-[150px] truncate">{t.items.map(i => `${i.serviceName} x${i.qty}`).join(', ')}</td>
```

GANTI DENGAN:
```tsx
<td className="text-gray-600 text-xs max-w-[150px] truncate">
  {t.items.map(i => {
    const isReward = i.serviceName.includes('REWARD') || (i.discountPercent === 100 && i.subtotal === 0)
    return `${i.serviceName} x${i.qty}${isReward ? ' 🎁' : ''}`
  }).join(', ')}
</td>
```

### Perubahan B: Di detail expanded (bagian items loop)

CARI:
```tsx
{t.items.map((item, i) => (
  <div key={i} className="flex justify-between py-0.5">
    <span className="text-gray-700">
      {item.serviceName} x{item.qty} @ {fmt(item.price)}
      {(item.discountPercent || 0) > 0 && (
        <span className="text-red-500 ml-1">(disc {item.discountPercent}% dari {fmt(item.originalPrice || item.price)})</span>
      )}
    </span>
    <span className="text-gray-800 font-medium">{fmt(item.subtotal)}</span>
  </div>
))}
```

GANTI DENGAN:
```tsx
{t.items.map((item, i) => {
  const isReward = item.serviceName.includes('REWARD') || (item.discountPercent === 100 && item.subtotal === 0)
  return (
    <div key={i} className="flex justify-between py-0.5">
      <span className="text-gray-700">
        {item.serviceName} x{item.qty} @ {fmt(item.price)}
        {isReward ? (
          <span className="ml-1 inline-block px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded">🎁 LOYALTY REWARD</span>
        ) : (item.discountPercent || 0) > 0 ? (
          <span className="text-red-500 ml-1">(disc {item.discountPercent}% dari {fmt(item.originalPrice || item.price)})</span>
        ) : null}
      </span>
      <span className={`font-medium ${isReward ? 'text-yellow-600' : 'text-gray-800'}`}>
        {isReward ? 'GRATIS' : fmt(item.subtotal)}
      </span>
    </div>
  )
})}
```

### Perubahan C: Di summary card, tambah info reward (opsional tapi bagus)

Tambahkan setelah summary cards (sebelum Grand Total):

```tsx
{/* Reward Summary */}
{completedTx.some(t => t.items.some(i => i.serviceName.includes('REWARD') || (i.discountPercent === 100 && i.subtotal === 0))) && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
    <span className="text-2xl">🎁</span>
    <div>
      <p className="text-sm font-medium text-yellow-800">Loyalty Reward</p>
      <p className="text-xs text-yellow-700">
        {completedTx.reduce((count, t) => count + t.items.filter(i => i.serviceName.includes('REWARD') || (i.discountPercent === 100 && i.subtotal === 0)).length, 0)} reward diklaim dalam periode ini
      </p>
    </div>
  </div>
)}
```
