# PATCH: Loyalty Reward System (v2 — dengan Pending Reward)

## Ringkasan Fitur
Pelanggan yang melakukan X transaksi dalam Y hari mendapat 1 treatment gratis.
- Identifikasi pelanggan via No HP (unik, tanpa sistem member)
- Semua parameter configurable oleh admin
- Kasir mendapat notifikasi otomatis saat pelanggan eligible
- **Reward yang sudah unlocked TIDAK langsung hangus** — pelanggan punya batas waktu klaim (configurable, default 60 hari)

## Flow Reward

```
Pelanggan capai 10 transaksi dalam 30 hari
  → Reward UNLOCKED → disimpan sebagai PendingReward (status: pending)
  → expiresAt = sekarang + 60 hari (configurable)

Next visit (kapan saja sebelum expiresAt):
  → Kasir input No HP → sistem cek → ada PendingReward yang masih valid
  → Banner muncul: "Pelanggan ini punya reward! Klaim sekarang?"
  → Kasir klik "Klaim" → item gratis masuk cart (harga 0)
  → Atau klik "Nanti" → reward tetap tersimpan, muncul lagi next visit

Jika lewat expiresAt:
  → PendingReward status berubah jadi "expired"
  → Reward hangus, counter mulai dari awal
```

## Config yang Bisa Diatur Admin

| Setting | Default | Keterangan |
|---------|---------|------------|
| minTransactions | 10 | Jumlah transaksi minimum |
| withinDays | 30 | Window perhitungan transaksi (hari) |
| claimDaysLimit | 60 | Batas waktu klaim setelah unlock (hari) |
| rewardServiceId | null | Treatment gratis (null = bebas pilih) |
| isActive | false | Aktif/nonaktif program |

## Cara Apply

### Step 1: Schema Prisma
Tambahkan model `Customer`, `LoyaltyConfig`, `PendingReward`, `RewardClaim` ke `prisma/schema.prisma`.
Tambahkan field `customerId` (opsional) ke model `Transaction`.
→ Lihat: `patches/loyalty/01-schema.prisma.patch`

### Step 2: Migrate
```bash
npx prisma migrate dev --name add-loyalty-reward
```

### Step 3: Buat API Files
- `src/app/api/customers/route.ts` → dari `patches/loyalty/02-api-customers-route.ts`
- `src/app/api/loyalty/config/route.ts` → dari `patches/loyalty/03-api-loyalty-config-route.ts`
- `src/app/api/loyalty/check/route.ts` → dari `patches/loyalty/04-api-loyalty-check-route.ts`
- `src/app/api/loyalty/claim/route.ts` → dari `patches/loyalty/05-api-loyalty-claim-route.ts`

### Step 4: Update Transaction API
Tambah `customerId` ke POST body & prisma create.
→ Lihat: `patches/loyalty/07-transaction-api-changes.ts`

### Step 5: Update POS Page
Tambah input pelanggan, loyalty check, reward banner.
→ Lihat: `patches/loyalty/06-pos-page-changes.tsx`

### Step 6: Buat Admin Loyalty Page
- `src/app/admin/loyalty/page.tsx` → dari `patches/loyalty/08-admin-loyalty-page.tsx`

### Step 7: Tambah Menu Link
Tambah button "🎁 Loyalty" di menu dropdown admin.
→ Lihat: `patches/loyalty/09-menu-additions.md`

### Step 8: Tambah Badge Reward di Transaksi & Report
Tambah penanda "🎁 REWARD" dan "GRATIS" di item yang merupakan loyalty reward.
→ Lihat: `patches/loyalty/10-transaksi-report-reward-badge.md`

## File Structure Baru
```
src/app/api/customers/route.ts          (baru)
src/app/api/loyalty/config/route.ts     (baru)
src/app/api/loyalty/check/route.ts      (baru)
src/app/api/loyalty/claim/route.ts      (baru)
src/app/admin/loyalty/page.tsx          (baru)
src/app/pos/page.tsx                    (modifikasi)
src/app/api/transactions/route.ts       (modifikasi)
src/app/transaksi/page.tsx              (modifikasi)
src/app/pembukuan/page.tsx              (modifikasi)
prisma/schema.prisma                    (modifikasi)
```
