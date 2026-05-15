# Panduan Membuat Website Kasir (POS) Dari Nol Sampai Online

Panduan ini ditulis untuk orang yang belum pernah membuat website sama sekali.
Ikuti langkah-langkahnya satu per satu, jangan loncat.

---

## BAGIAN 1: PERSIAPAN (Install Alat-Alat)

### 1.1 Install Node.js

Node.js adalah "mesin" yang menjalankan website kita di komputer.

1. Buka https://nodejs.org
2. Klik tombol hijau "LTS" (yang recommended)
3. Install seperti biasa (Next, Next, Finish)
4. Untuk cek sudah berhasil, buka Command Prompt (ketik `cmd` di Start Menu), lalu ketik:
   ```
   node --version
   ```
   Kalau muncul angka seperti `v20.x.x`, berarti sudah berhasil.

### 1.2 Install Visual Studio Code (VS Code)

VS Code adalah tempat kita menulis kode. Seperti Microsoft Word, tapi untuk kode program.

1. Buka https://code.visualstudio.com
2. Download dan install

### 1.3 Install Git

Git adalah alat untuk menyimpan dan mengirim kode ke internet.

1. Buka https://git-scm.com
2. Download dan install (klik Next terus sampai Finish, pakai settingan default)
3. Cek sudah berhasil, buka Command Prompt, ketik:
   ```
   git --version
   ```

### 1.4 Buat Akun GitHub

GitHub adalah tempat menyimpan kode program di internet (seperti Google Drive untuk kode).

1. Buka https://github.com
2. Klik Sign Up, isi email, password, username
3. Verifikasi email

### 1.5 Buat Akun Supabase

Supabase adalah database online gratis — tempat menyimpan data penjualan, data user, dll.

1. Buka https://supabase.com
2. Klik "Start your project"
3. Login pakai akun GitHub

### 1.6 Buat Akun Vercel

Vercel membuat website kita bisa diakses dari internet (seperti menyewa tempat di internet).

1. Buka https://vercel.com
2. Klik "Sign Up"
3. Pilih "Continue with GitHub"

---

## BAGIAN 2: BUAT PROJECT WEBSITE

### 2.1 Buat Folder Project

1. Buka VS Code
2. Buka Terminal di VS Code: klik menu **Terminal → New Terminal** (atau tekan Ctrl + `)
3. Di terminal, ketik:

```
npx create-next-app@latest es-teh-solo-pos
```

4. Akan muncul pertanyaan, jawab seperti ini:
   - Would you like to use TypeScript? → **Yes**
   - Would you like to use ESLint? → **Yes**
   - Would you like to use Tailwind CSS? → **Yes**
   - Would you like your code inside a `src/` directory? → **Yes**
   - Would you like to use App Router? → **Yes**
   - Would you like to use Turbopack? → **No**
   - Would you like to customize the import alias? → **No** (tekan Enter)

5. Tunggu sampai selesai, lalu masuk ke folder project:
```
cd es-teh-solo-pos
```

6. Install library untuk database:
```
npm install @supabase/supabase-js
```

### 2.2 Buka Project di VS Code

1. Di VS Code, klik **File → Open Folder**
2. Pilih folder `es-teh-solo-pos` yang baru dibuat
3. Klik "Yes, I trust the authors" kalau ditanya

---

## BAGIAN 3: TULIS KODE WEBSITE

Sekarang kita akan membuat file-file website. Untuk setiap file di bawah ini:
1. Cari file-nya di panel kiri VS Code (kalau sudah ada, klik file-nya)
2. Kalau file belum ada, klik kanan di folder yang sesuai → **New File** → ketik nama file
3. **Hapus semua isi** yang ada di file tersebut
4. **Copy-paste** kode di bawah ini ke dalam file
5. Tekan **Ctrl+S** untuk menyimpan

> **PENTING:** Copy-paste SEMUA kode persis seperti yang tertulis. Jangan ubah apapun.

---

### 3.1 File: `src/app/globals.css`

File ini mengatur warna dan tampilan dasar website.
Buka file `src/app/globals.css`, hapus semua isinya, lalu paste kode ini:

```css
@import "tailwindcss";

@theme {
  --color-primary: #1B8C3D;
  --color-primary-dark: #14692E;
  --color-primary-light: #E8F5E9;
  --color-navy: #1B2A4A;
  --color-navy-light: #2C3E6B;
}

html, body {
  overflow: hidden;
  height: 100dvh;
  -webkit-user-select: none;
  user-select: none;
}

@media print {
  body * { visibility: hidden; }
  #receipt-print, #receipt-print * { visibility: visible; }
  #receipt-print { position: absolute; left: 0; top: 0; width: 80mm; }
}
```

---

### 3.2 File: `src/app/layout.tsx`

File ini adalah "bungkus" utama website. Buka file `src/app/layout.tsx`, hapus semua isinya, lalu paste:

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Es Teh Solo - POS",
  description: "Point of Sale - Es Teh Solo",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1B8C3D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Es Teh Solo" />
      </head>
      <body className="bg-gray-100 h-dvh overflow-hidden">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js")}`,
          }}
        />
      </body>
    </html>
  );
}
```

---

### 3.3 File: `src/app/lib/supabase.ts`

File ini untuk koneksi ke database. Pertama buat folder dulu:
1. Klik kanan folder `src/app` → **New Folder** → ketik `lib`
2. Klik kanan folder `lib` yang baru → **New File** → ketik `supabase.ts`
3. Paste kode ini:

```ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.error("Supabase env vars missing! URL:", !!url, "KEY:", !!key);
      _supabase = createClient("https://placeholder.supabase.co", "placeholder");
    } else {
      _supabase = createClient(url, key);
    }
  }
  return _supabase;
}
```

---

### 3.4 File: `src/app/components/Logo.tsx`

Sekarang buat folder untuk komponen-komponen:
1. Klik kanan folder `src/app` → **New Folder** → ketik `components`
2. Klik kanan folder `components` → **New File** → ketik `Logo.tsx`
3. Paste kode ini:

```tsx
export default function Logo({ size = 120 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 220" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      {/* Left tree */}
      <g transform="translate(30, 10)">
        <polygon points="35,0 5,35 20,30 0,60 15,55 -5,85 75,85 55,55 70,60 50,30 65,35" fill="#1B8C3D"/>
        <path d="M30,25 Q35,45 30,85 M40,25 Q35,45 40,85" stroke="white" strokeWidth="3" fill="none" opacity="0.5"/>
      </g>
      {/* Center tree */}
      <g transform="translate(65, 0)">
        <polygon points="35,0 5,35 20,30 0,60 15,55 -5,85 75,85 55,55 70,60 50,30 65,35" fill="#22A948"/>
        <path d="M30,25 Q35,45 30,85 M40,25 Q35,45 40,85" stroke="white" strokeWidth="3" fill="none" opacity="0.5"/>
      </g>
      {/* Right tree */}
      <g transform="translate(100, 10)">
        <polygon points="35,0 5,35 20,30 0,60 15,55 -5,85 75,85 55,55 70,60 50,30 65,35" fill="#1B8C3D"/>
        <path d="M30,25 Q35,45 30,85 M40,25 Q35,45 40,85" stroke="white" strokeWidth="3" fill="none" opacity="0.5"/>
      </g>
      {/* Trunks */}
      <rect x="55" y="95" width="10" height="15" fill="#8B6914" rx="2"/>
      <rect x="95" y="85" width="10" height="15" fill="#8B6914" rx="2"/>
      <rect x="125" y="95" width="10" height="15" fill="#8B6914" rx="2"/>
      {/* Text */}
      <text x="100" y="140" textAnchor="middle" fontFamily="Georgia, serif" fontSize="36" fontWeight="bold" fill="#1B2A4A">Es Teh</text>
      <text x="100" y="162" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" letterSpacing="6" fill="#1B2A4A">S.O.L.O</text>
    </svg>
  );
}
```

---

### 3.5 File: `src/app/components/MenuCard.tsx`

Klik kanan folder `components` → **New File** → ketik `MenuCard.tsx`, lalu paste:

```tsx
"use client";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  emoji?: string;
  image?: string;
  category: "original" | "rasa" | "topping";
}

interface MenuCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export default function MenuCard({ item, onAdd }: MenuCardProps) {
  return (
    <button
      onClick={() => onAdd(item)}
      className="bg-white rounded-2xl p-4 shadow-md active:scale-95 transition-transform
                 flex flex-col items-center gap-2 border-2 border-transparent
                 hover:border-primary focus:border-primary focus:outline-none"
      aria-label={`Tambah ${item.name} - Rp ${item.price.toLocaleString("id-ID")}`}
    >
      {item.image ? (
        <img src={item.image} alt={item.name} className="w-20 h-20 object-contain" />
      ) : (
        <span className="text-4xl">{item.emoji}</span>
      )}
      <span className="text-navy font-semibold text-sm text-center leading-tight">{item.name}</span>
      <span className="text-primary font-bold text-base">
        Rp {item.price.toLocaleString("id-ID")}
      </span>
    </button>
  );
}
```

---

### 3.6 File: `src/app/components/Cart.tsx`

Klik kanan folder `components` → **New File** → ketik `Cart.tsx`, lalu paste:

```tsx
"use client";

import type { MenuItem } from "./MenuCard";

export interface CartItem extends MenuItem {
  qty: number;
}

interface CartProps {
  items: CartItem[];
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export default function Cart({ items, onIncrease, onDecrease, onClear, onCheckout }: CartProps) {
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-navy font-bold text-lg">🛒 Pesanan</h2>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="text-red-500 text-sm font-medium active:scale-95"
            aria-label="Hapus semua pesanan"
          >
            Hapus Semua
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {items.length === 0 ? (
          <p className="text-gray-400 text-center mt-8 text-sm">Belum ada pesanan</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-primary-light rounded-xl px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-navy font-medium text-sm truncate">{item.emoji} {item.name}</p>
                <p className="text-primary text-xs">Rp {(item.price * item.qty).toLocaleString("id-ID")}</p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => onDecrease(item.id)}
                  className="w-7 h-7 rounded-full bg-white text-navy font-bold text-lg flex items-center justify-center shadow active:scale-90"
                  aria-label={`Kurangi ${item.name}`}
                >−</button>
                <span className="text-navy font-bold text-sm w-5 text-center">{item.qty}</span>
                <button
                  onClick={() => onIncrease(item.id)}
                  className="w-7 h-7 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center shadow active:scale-90"
                  aria-label={`Tambah ${item.name}`}
                >+</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-200 px-4 py-3 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-navy font-bold text-lg">Total</span>
          <span className="text-primary font-bold text-xl">Rp {total.toLocaleString("id-ID")}</span>
        </div>
        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold text-lg
                     disabled:opacity-40 disabled:cursor-not-allowed
                     active:bg-primary-dark transition-colors"
        >
          Bayar
        </button>
      </div>
    </div>
  );
}
```

---

### 3.7 File: `src/app/components/Receipt.tsx`

Klik kanan folder `components` → **New File** → ketik `Receipt.tsx`, lalu paste:

```tsx
"use client";

import type { CartItem } from "./Cart";
import Logo from "./Logo";

interface ReceiptProps {
  items: CartItem[];
  payAmount: number;
  onClose: () => void;
  orderNumber: number;
}

export default function Receipt({ items, payAmount, onClose, orderNumber }: ReceiptProps) {
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const change = payAmount - total;
  const now = new Date();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div id="receipt-print" className="p-6 space-y-4">
          <div className="flex flex-col items-center gap-1">
            <Logo size={80} />
            <p className="text-gray-500 text-xs mt-1">
              {now.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}{" "}
              {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-navy font-bold text-sm">Order #{String(orderNumber).padStart(4, "0")}</p>
          </div>

          <div className="border-t border-dashed border-gray-300" />

          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.name} x{item.qty}
                </span>
                <span className="text-navy font-medium">
                  Rp {(item.price * item.qty).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300" />

          <div className="space-y-1">
            <div className="flex justify-between font-bold text-navy">
              <span>Total</span>
              <span>Rp {total.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Bayar</span>
              <span>Rp {payAmount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-primary">
              <span>Kembalian</span>
              <span>Rp {change.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300" />
          <p className="text-center text-gray-400 text-xs">Terima kasih sudah mampir! 🍵</p>
        </div>

        <div className="flex border-t border-gray-200">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 text-primary font-bold text-sm border-r border-gray-200 active:bg-gray-50"
          >
            🖨️ Cetak
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 text-white bg-primary font-bold text-sm active:bg-primary-dark"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 3.8 File: `src/app/components/Login.tsx`

Klik kanan folder `components` → **New File** → ketik `Login.tsx`, lalu paste:

```tsx
"use client";

import { useState } from "react";
import { getSupabase } from "../lib/supabase";
import Logo from "./Logo";

export interface User {
  id: number;
  username: string;
  role: "admin" | "kasir";
}

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: err } = await getSupabase()
      .from("users")
      .select("id, username, role")
      .eq("username", username)
      .eq("password", password)
      .single();

    setLoading(false);

    if (err || !data) {
      setError("Username atau password salah");
      return;
    }

    localStorage.setItem("estehsolo-user", JSON.stringify(data));
    onLogin(data as User);
  };

  return (
    <div className="h-dvh bg-navy flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-sm p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col items-center gap-2">
          <Logo size={100} />
          <p className="text-gray-500 text-sm">Point of Sale</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-navy font-medium
                         focus:border-primary focus:outline-none"
              placeholder="Masukkan username"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-navy font-medium
                         focus:border-primary focus:outline-none"
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold text-lg
                     disabled:opacity-50 active:bg-primary-dark transition-colors"
        >
          {loading ? "Masuk..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
```

---

### 3.9 File: `src/app/components/SalesReport.tsx`

Klik kanan folder `components` → **New File** → ketik `SalesReport.tsx`, lalu paste:

```tsx
"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "../lib/supabase";

export interface SaleRecord {
  id: string;
  order_number: number;
  items: { name: string; qty: number; price: number }[];
  total: number;
  pay_amount: number;
  change: number;
  created_at: string;
}

interface ExpenseRecord {
  id: string;
  item_name: string;
  amount: number;
  created_by: string;
  created_at: string;
}

interface SalesReportProps {
  onClose: () => void;
}

function formatRp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function toDateKey(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function toMonthKey(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export async function saveSale(sale: Omit<SaleRecord, "created_at">) {
  const { error } = await getSupabase().from("sales").insert(sale);
  if (error) console.error("Gagal simpan:", error.message);
}

export default function SalesReport({ onClose }: SalesReportProps) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"harian" | "bulanan" | "pengeluaran">("harian");
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  useEffect(() => {
    async function fetchSales() {
      const { data, error } = await getSupabase()
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setSales(data);
      setLoading(false);
    }
    async function fetchExpenses() {
      const { data, error } = await getSupabase()
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setExpenses(data);
    }
    fetchSales();
    fetchExpenses();
  }, []);

  const dateGroups = sales.reduce<Record<string, SaleRecord[]>>((acc, s) => {
    const key = toDateKey(s.created_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const dates = Object.keys(dateGroups);
  const filtered = selectedDate ? (dateGroups[selectedDate] || []) : sales;

  const monthGroups = sales.reduce<Record<string, SaleRecord[]>>((acc, s) => {
    const key = toMonthKey(s.created_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  const months = Object.keys(monthGroups);
  const monthFiltered = selectedMonth ? (monthGroups[selectedMonth] || []) : sales;

  const activeData = tab === "harian" ? filtered : monthFiltered;
  const totalRevenue = activeData.reduce((s, r) => s + r.total, 0);
  const totalTransactions = activeData.length;

  const activeExpenses = tab === "harian" && selectedDate
    ? expenses.filter(e => toDateKey(e.created_at) === selectedDate)
    : tab === "bulanan" && selectedMonth
    ? expenses.filter(e => toMonthKey(e.created_at) === selectedMonth)
    : expenses;
  const totalExpense = activeExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpense;

  const itemCount: Record<string, number> = {};
  activeData.forEach((r) => r.items.forEach((i) => {
    itemCount[i.name] = (itemCount[i.name] || 0) + i.qty;
  }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85dvh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-navy font-bold text-lg">📊 Laporan Penjualan</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none" aria-label="Tutup">×</button>
        </div>

        <div className="flex px-5 pt-3 gap-2">
          <button
            onClick={() => setTab("harian")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === "harian" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => setTab("bulanan")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === "bulanan" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setTab("pengeluaran")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === "pengeluaran" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Pengeluaran
          </button>
        </div>

        {tab !== "pengeluaran" && (
        <div className="px-5 py-3 border-b border-gray-100">
          {tab === "harian" ? (
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-navy font-medium focus:border-primary focus:outline-none"
            >
              <option value="">Semua Tanggal</option>
              {dates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          ) : (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-navy font-medium focus:border-primary focus:outline-none"
            >
              <option value="">Semua Bulan</option>
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </div>
        )}

        {tab !== "pengeluaran" && (
        <div className="grid grid-cols-2 gap-3 px-5 py-3">
          <div className="bg-primary-light rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Pendapatan</p>
            <p className="text-primary font-bold text-sm">{formatRp(totalRevenue)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Pengeluaran</p>
            <p className="text-red-500 font-bold text-sm">{formatRp(totalExpense)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${netProfit >= 0 ? "bg-primary-light" : "bg-red-50"}`}>
            <p className="text-xs text-gray-500">Laba Bersih</p>
            <p className={`font-bold text-sm ${netProfit >= 0 ? "text-primary" : "text-red-500"}`}>{formatRp(netProfit)}</p>
          </div>
          <div className="bg-gray-100 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Transaksi</p>
            <p className="text-navy font-bold text-sm">{totalTransactions}</p>
          </div>
        </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2">
          {loading ? (
            <p className="text-gray-400 text-center mt-8 text-sm">Memuat data...</p>
          ) : tab === "pengeluaran" ? (
            <>
              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Total Pengeluaran</p>
                  <p className="text-red-500 font-bold text-sm">{formatRp(expenses.reduce((s, e) => s + e.amount, 0))}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Jumlah Item</p>
                  <p className="text-red-500 font-bold text-sm">{expenses.length}</p>
                </div>
              </div>
              {expenses.length === 0 ? (
                <p className="text-gray-400 text-center mt-4 text-sm">Belum ada pengeluaran</p>
              ) : (
                expenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-navy font-medium text-sm">{exp.item_name}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(exp.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        {" · "}
                        {new Date(exp.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        {" · "}{exp.created_by}
                      </p>
                    </div>
                    <p className="text-red-500 font-bold text-sm">-{formatRp(exp.amount)}</p>
                  </div>
                ))
              )}
            </>
          ) : activeData.length === 0 ? (
            <p className="text-gray-400 text-center mt-8 text-sm">Belum ada transaksi</p>
          ) : tab === "bulanan" ? (
            <>
              <div className="space-y-2">
                <p className="text-navy font-semibold text-sm">Rincian per Item</p>
                {Object.entries(itemCount).sort((a, b) => b[1] - a[1]).map(([name, qty]) => {
                  const itemTotal = activeData.reduce((sum, r) =>
                    sum + r.items.filter(i => i.name === name).reduce((s, i) => s + i.price * i.qty, 0), 0);
                  return (
                    <div key={name} className="flex items-center justify-between bg-primary-light rounded-xl px-4 py-3">
                      <div>
                        <p className="text-navy font-medium text-sm">{name}</p>
                        <p className="text-gray-500 text-xs">Terjual: {qty} cup</p>
                      </div>
                      <p className="text-primary font-bold text-sm">{formatRp(itemTotal)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-navy font-semibold text-sm">Per Hari</p>
                {Object.entries(
                  activeData.reduce<Record<string, { count: number; total: number }>>((acc, s) => {
                    const day = toDateKey(s.created_at);
                    if (!acc[day]) acc[day] = { count: 0, total: 0 };
                    acc[day].count++;
                    acc[day].total += s.total;
                    return acc;
                  }, {})
                ).map(([day, info]) => (
                  <div key={day} className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-navy font-medium text-sm">{day}</p>
                      <p className="text-gray-400 text-xs">{info.count} transaksi</p>
                    </div>
                    <p className="text-primary font-bold text-sm">{formatRp(info.total)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            filtered.map((sale) => (
              <div key={sale.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-gray-50"
                >
                  <div>
                    <p className="text-navy font-medium text-sm">Order #{String(sale.order_number).padStart(4, "0")}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(sale.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <p className="text-primary font-bold text-sm">{formatRp(sale.total)}</p>
                </button>
                {expandedId === sale.id && (
                  <div className="px-4 pb-3 border-t border-gray-100 space-y-1 pt-2">
                    {sale.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-600">
                        <span>{item.name} x{item.qty}</span>
                        <span>{formatRp(item.price * item.qty)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs text-gray-400 pt-1 border-t border-dashed border-gray-200">
                      <span>Bayar: {formatRp(sale.pay_amount)}</span>
                      <span>Kembali: {formatRp(sale.change)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold active:bg-primary-dark transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 3.10 File: `src/app/components/Expense.tsx`

Klik kanan folder `components` → **New File** → ketik `Expense.tsx`, lalu paste:

```tsx
"use client";

import { useState } from "react";
import { getSupabase } from "../lib/supabase";

interface ExpenseProps {
  onClose: () => void;
  username: string;
}

export default function Expense({ onClose, username }: ExpenseProps) {
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !amount) return;

    setLoading(true);
    setError("");

    const { error: err } = await getSupabase().from("expenses").insert({
      id: `exp-${Date.now()}`,
      item_name: itemName.trim(),
      amount: parseInt(amount),
      created_by: username,
    });

    setLoading(false);

    if (err) {
      setError("Gagal menyimpan: " + err.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setItemName("");
      setAmount("");
    }, 1500);
  };

  const formatDisplay = (val: string) => {
    if (!val) return "";
    return parseInt(val).toLocaleString("id-ID");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-navy font-bold text-lg">🛒 Catat Pengeluaran</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none" aria-label="Tutup">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Nama Barang</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Contoh: Gula pasir, Teh, Es batu..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-navy font-medium
                         focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 block mb-1">Harga (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 text-navy font-bold text-lg
                           focus:border-primary focus:outline-none"
                required
              />
            </div>
            {amount && (
              <p className="text-xs text-gray-400 mt-1">Rp {formatDisplay(amount)}</p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {success && <p className="text-primary text-sm text-center font-medium">✅ Berhasil disimpan!</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold active:bg-gray-50"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={loading || !itemName.trim() || !amount}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold
                         disabled:opacity-40 disabled:cursor-not-allowed active:bg-primary-dark transition-colors"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### 3.11 File: `src/app/page.tsx`

Ini adalah file utama website. Buka file `src/app/page.tsx`, hapus semua isinya, lalu paste:

```tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import Logo from "./components/Logo";
import MenuCard, { type MenuItem } from "./components/MenuCard";
import Cart, { type CartItem } from "./components/Cart";
import Receipt from "./components/Receipt";
import SalesReport, { saveSale } from "./components/SalesReport";
import Login, { type User } from "./components/Login";
import Expense from "./components/Expense";

const MENU: MenuItem[] = [
  { id: "etm-besar", name: "Es Teh Manis Besar", price: 5000, image: "/teh-besar.png", category: "original" },
  { id: "etm-kecil", name: "Es Teh Manis Kecil", price: 3000, image: "/teh-kecil.png", category: "original" },
];

const QUICK_CASH = [10000, 20000, 50000, 100000];

export default function POSPage() {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [customPay, setCustomPay] = useState("");
  const [orderNum, setOrderNum] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showExpense, setShowExpense] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("estehsolo-user");
      if (saved) setUser(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("estehsolo-user");
    setUser(null);
    setCart([]);
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      if (exists) return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const increase = useCallback((id: string) => {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: c.qty + 1 } : c)));
  }, []);

  const decrease = useCallback((id: string) => {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: c.qty - 1 } : c)).filter((c) => c.qty > 0));
  }, []);

  const handleCheckout = () => {
    setPayAmount(0);
    setCustomPay("");
    setShowPayment(true);
  };

  const confirmPay = () => {
    const amount = customPay ? parseInt(customPay) : payAmount;
    if (amount >= total) {
      setPayAmount(amount);
      setShowPayment(false);
      setShowReceipt(true);
    }
  };

  const finishOrder = () => {
    const amount = payAmount || parseInt(customPay);
    saveSale({
      id: `${Date.now()}-${orderNum}`,
      order_number: orderNum,
      items: cart.map((c) => ({ name: c.name, qty: c.qty, price: c.price })),
      total,
      pay_amount: amount,
      change: amount - total,
    });
    setShowReceipt(false);
    setCart([]);
    setOrderNum((n) => n + 1);
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="h-dvh flex flex-col">
      {/* Header */}
      <header className="bg-navy text-white flex items-center gap-3 px-4 py-2 shadow-lg">
        <Logo size={48} />
        <div>
          <h1 className="font-bold text-lg leading-tight">Es Teh Solo</h1>
          <p className="text-green-300 text-xs">Point of Sale</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {user.role === "admin" && (
            <button
              onClick={() => setShowReport(true)}
              className="bg-navy-light px-3 py-1.5 rounded-lg text-xs font-medium active:scale-95 transition-transform"
            >
              📊 Laporan
            </button>
          )}
          <button
            onClick={() => setShowExpense(true)}
            className="bg-navy-light px-3 py-1.5 rounded-lg text-xs font-medium active:scale-95 transition-transform"
          >
            🛒 Pengeluaran
          </button>
          <div className="text-right">
            <p className="text-xs text-gray-300">
              👤 {user.username} ({user.role})
            </p>
            <p className="text-xs text-green-300">Order #{String(orderNum).padStart(4, "0")}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg text-xs font-medium active:scale-95 transition-transform"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Menu area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 pb-20 lg:pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {MENU.map((item) => (
                <MenuCard key={item.id} item={item} onAdd={addToCart} />
              ))}
            </div>
          </div>
        </div>

        {/* Cart sidebar - desktop/landscape */}
        <aside className="hidden lg:flex w-80 bg-white border-l border-gray-200 flex-col">
          <Cart
            items={cart}
            onIncrease={increase}
            onDecrease={decrease}
            onClear={() => setCart([])}
            onCheckout={handleCheckout}
          />
        </aside>
      </div>

      {/* Floating cart button - tablet/mobile only */}
      {!showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="lg:hidden fixed bottom-4 right-4 z-40 bg-primary text-white rounded-full w-16 h-16
                     flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          aria-label="Buka keranjang"
        >
          <span className="text-2xl">🛒</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      )}

      {/* Cart slide-up panel - tablet/mobile only */}
      {showCart && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[75dvh] flex flex-col shadow-2xl">
            <div className="flex justify-center pt-2 pb-1">
              <button
                onClick={() => setShowCart(false)}
                className="w-12 h-1.5 bg-gray-300 rounded-full"
                aria-label="Tutup keranjang"
              />
            </div>
            <Cart
              items={cart}
              onIncrease={increase}
              onDecrease={decrease}
              onClear={() => setCart([])}
              onCheckout={() => { setShowCart(false); handleCheckout(); }}
            />
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="text-navy font-bold text-xl text-center">Pembayaran</h2>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total</p>
              <p className="text-primary font-bold text-3xl">Rp {total.toLocaleString("id-ID")}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {QUICK_CASH.map((amount) => (
                <button
                  key={amount}
                  onClick={() => { setPayAmount(amount); setCustomPay(""); }}
                  className={`py-3 rounded-xl font-bold text-sm transition-colors
                    ${payAmount === amount && !customPay
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-navy active:bg-gray-200"
                    }`}
                >
                  Rp {amount.toLocaleString("id-ID")}
                </button>
              ))}
            </div>

            <div>
              <label className="text-sm text-gray-500 block mb-1">Jumlah lain</label>
              <input
                type="number"
                inputMode="numeric"
                value={customPay}
                onChange={(e) => { setCustomPay(e.target.value); setPayAmount(0); }}
                placeholder="Masukkan nominal..."
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-navy
                           focus:border-primary focus:outline-none"
              />
            </div>

            {((customPay ? parseInt(customPay) : payAmount) > 0) && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Kembalian</p>
                <p className={`font-bold text-xl ${
                  (customPay ? parseInt(customPay) : payAmount) >= total ? "text-primary" : "text-red-500"
                }`}>
                  Rp {((customPay ? parseInt(customPay) : payAmount) - total).toLocaleString("id-ID")}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold active:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={confirmPay}
                disabled={(customPay ? parseInt(customPay) : payAmount) < total}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold
                           disabled:opacity-40 disabled:cursor-not-allowed active:bg-primary-dark"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {showReceipt && (
        <Receipt items={cart} payAmount={payAmount || parseInt(customPay)} onClose={finishOrder} orderNumber={orderNum} />
      )}

      {/* Sales Report modal */}
      {showReport && <SalesReport onClose={() => setShowReport(false)} />}

      {/* Expense modal */}
      {showExpense && <Expense onClose={() => setShowExpense(false)} username={user.username} />}
    </div>
  );
}
```

---

### 3.12 File: `next.config.ts`

File ini ada di folder utama project (bukan di dalam `src`). Buka file `next.config.ts`, hapus isinya, lalu paste:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

---

### 3.13 File: `public/manifest.json`

File ini untuk membuat website bisa di-install di tablet. Buka folder `public`, buat file baru `manifest.json`:

```json
{
  "name": "Es Teh Solo - POS",
  "short_name": "Es Teh Solo",
  "description": "Point of Sale - Es Teh Solo",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1B8C3D",
  "orientation": "any",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

### 3.14 File: `public/sw.js`

Masih di folder `public`, buat file baru `sw.js`:

```js
const CACHE_NAME = "estehsolo-v1";
const ASSETS = ["/", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
```

---

### 3.15 Gambar Menu

Kamu perlu 2 gambar untuk menu:
- `public/teh-besar.png` — gambar Es Teh Manis Besar
- `public/teh-kecil.png` — gambar Es Teh Manis Kecil

Siapkan 2 foto cup teh kamu, lalu:
1. Rename (ganti nama) jadi `teh-besar.png` dan `teh-kecil.png`
2. Copy ke folder `public` di project

---

### 3.16 File: `.env.local`

File ini menyimpan "kunci rahasia" untuk koneksi ke database. File ini ada di folder utama project (sejajar dengan `package.json`).

1. Klik kanan di panel kiri VS Code (di area folder utama, bukan di dalam `src`)
2. Pilih **New File** → ketik `.env.local` (ada titik di depan)
3. Paste kode ini (nanti kita isi setelah setup Supabase di Bagian 4):

```
NEXT_PUBLIC_SUPABASE_URL=ISI_NANTI
NEXT_PUBLIC_SUPABASE_ANON_KEY=ISI_NANTI
```

---

### 3.17 Cek Website di Komputer

Sekarang coba jalankan website di komputer:

1. Buka Terminal di VS Code (Terminal → New Terminal)
2. Ketik:
```
npm run dev
```
3. Tunggu sampai muncul tulisan `Ready`
4. Buka browser, ketik: `http://localhost:3000`
5. Kalau muncul halaman login, berarti kode sudah benar! 🎉
6. Untuk menghentikan, tekan **Ctrl+C** di terminal

> **Catatan:** Login belum bisa dipakai karena database belum di-setup. Lanjut ke Bagian 4.

---

## BAGIAN 4: SETUP DATABASE (SUPABASE)

### 4.1 Buat Project di Supabase

1. Buka https://supabase.com dan login
2. Klik **New Project**
3. Isi:
   - **Name:** `estehsolo` (atau nama apa saja)
   - **Database Password:** buat password (catat, tapi tidak perlu dipakai lagi)
   - **Region:** pilih yang paling dekat (Singapore)
4. Klik **Create new project**
5. Tunggu sampai project selesai dibuat (1-2 menit)

### 4.2 Buat Tabel Database

Setelah project selesai dibuat:

1. Di menu kiri Supabase, klik **SQL Editor**
2. Klik **New query**
3. Copy-paste kode SQL di bawah ini ke dalam editor:

```sql
-- Tabel untuk menyimpan data penjualan
CREATE TABLE sales (
  id TEXT PRIMARY KEY,
  order_number INTEGER NOT NULL,
  items JSONB NOT NULL,
  total INTEGER NOT NULL,
  pay_amount INTEGER NOT NULL,
  change INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel untuk menyimpan data user (login)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'kasir'
);

-- Tabel untuk menyimpan data pengeluaran
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  item_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buat user default
INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin');
INSERT INTO users (username, password, role) VALUES ('kasir', 'kasir123', 'kasir');

-- Izinkan akses dari website
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
```

4. Klik tombol **Run** (atau tekan Ctrl+Enter)
5. Kalau muncul "Success", berarti tabel sudah dibuat! ✅

### 4.3 Ambil URL dan Key Supabase

1. Di menu kiri Supabase, klik **Settings** (ikon gear ⚙️)
2. Klik **API** (di bawah "Configuration")
3. Kamu akan melihat:
   - **Project URL** — copy ini (contoh: `https://abcdefg.supabase.co`)
   - **anon public key** — copy ini (huruf panjang sekali)

### 4.4 Isi File .env.local

1. Buka file `.env.local` di VS Code
2. Ganti isinya dengan URL dan Key yang sudah di-copy:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
```

> **PENTING:** Ganti `https://abcdefg.supabase.co` dengan URL kamu yang asli, dan ganti key-nya juga.

3. Simpan file (Ctrl+S)

### 4.5 Coba Login

1. Jalankan lagi website: `npm run dev`
2. Buka `http://localhost:3000`
3. Login dengan:
   - Username: `admin` | Password: `admin123` (bisa lihat Laporan)
   - Username: `kasir` | Password: `kasir123` (hanya bisa transaksi)

Kalau berhasil login, database sudah terhubung! 🎉

---

## BAGIAN 5: UPLOAD KE GITHUB

### 5.1 Buat Repository di GitHub

1. Buka https://github.com
2. Klik tombol **+** di kanan atas → **New repository**
3. Isi:
   - **Repository name:** `es-teh-solo-pos`
   - Pilih **Public** atau **Private** (terserah)
   - **JANGAN** centang "Add a README file"
4. Klik **Create repository**

### 5.2 Upload Kode ke GitHub

1. Buka Terminal di VS Code
2. Pastikan kamu ada di folder `es-teh-solo-pos` (cek di terminal, harusnya tertulis `es-teh-solo-pos`)
3. Ketik perintah ini satu per satu:

```
git init
git add .
git commit -m "Website Es Teh Solo POS"
git branch -M main
git remote add origin https://github.com/USERNAME_KAMU/es-teh-solo-pos.git
git push -u origin main
```

> **PENTING:** Ganti `USERNAME_KAMU` dengan username GitHub kamu yang asli.

4. Kalau diminta login, masukkan username dan password GitHub
5. Kalau berhasil, buka GitHub dan cek repository-nya — kode sudah ada di sana! ✅

---

## BAGIAN 6: DEPLOY KE VERCEL (BIAR BISA DIAKSES DARI INTERNET)

### 6.1 Install Vercel CLI

1. Buka Terminal di VS Code
2. Ketik:
```
npm i -g vercel
```

### 6.2 Login Vercel

1. Di terminal, ketik:
```
vercel login
```
2. Pilih **Continue with GitHub**
3. Akan terbuka browser, klik **Authorize**

### 6.3 Deploy Website

1. Pastikan kamu ada di folder `es-teh-solo-pos`
2. Ketik:
```
vercel --prod
```
3. Akan muncul pertanyaan:
   - Set up and deploy? → **Y** (tekan Enter)
   - Which scope? → pilih akun kamu (tekan Enter)
   - Link to existing project? → **N**
   - What's your project's name? → ketik nama, misal `esteh-solo1` (tekan Enter)
   - In which directory is your code located? → tekan **Enter** (biarkan default `./`)
   - Want to modify these settings? → **N** (tekan Enter)

4. Tunggu sampai selesai deploy

### 6.4 PENTING: Cek Framework Preset

Ini langkah yang SANGAT PENTING. Kalau salah, website akan error 404.

1. Buka https://vercel.com
2. Klik project kamu (misal `esteh-solo1`)
3. Klik **Settings** (di menu atas)
4. Klik **General**
5. Scroll ke bawah, cari **Framework Preset**
6. Pastikan tertulis **Next.js**
   - Kalau tertulis "Other" atau yang lain, **GANTI** ke **Next.js**
   - Klik **Save**

### 6.5 Tambahkan Environment Variables di Vercel

Website butuh koneksi ke database, jadi kita perlu tambahkan kunci rahasia di Vercel:

1. Masih di halaman project Vercel, klik **Settings**
2. Klik **Environment Variables** (di menu kiri)
3. Tambahkan 2 variabel:

   **Variabel 1:**
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: (paste URL Supabase kamu, contoh: `https://abcdefg.supabase.co`)
   - Klik **Save**

   **Variabel 2:**
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: (paste anon key Supabase kamu)
   - Klik **Save**

### 6.6 Deploy Ulang

Setelah menambahkan environment variables, deploy ulang supaya website pakai kunci yang baru:

1. Di terminal VS Code, ketik:
```
vercel --prod --yes
```

2. Tunggu sampai selesai
3. Akan muncul link website kamu, contoh: `https://esteh-solo1.vercel.app`
4. Buka link tersebut di browser — website sudah online! 🎉

---

## BAGIAN 7: BUKA DI TABLET (STANDALONE / SEPERTI APLIKASI)

### Untuk iPad / iPhone:
1. Buka **Safari** (harus Safari, bukan Chrome)
2. Ketik alamat website kamu, contoh: `https://esteh-solo1.vercel.app`
3. Tap ikon **Share** (kotak dengan panah ke atas) di bawah layar
4. Scroll ke bawah, tap **Add to Home Screen**
5. Ketik nama "Es Teh Solo", lalu tap **Add**
6. Sekarang ada ikon di Home Screen — tap untuk buka seperti aplikasi! 📱

### Untuk Tablet Android:
1. Buka **Chrome**
2. Ketik alamat website kamu
3. Tap titik tiga (⋮) di kanan atas
4. Tap **Add to Home screen** atau **Install app**
5. Ketik nama "Es Teh Solo", tap **Add**
6. Sekarang ada ikon di Home Screen! 📱

---

## BAGIAN 8: CARA UPDATE WEBSITE

Kalau kamu mau mengubah kode website (misalnya ganti harga, tambah menu, dll):

### Langkah Update:

1. Ubah kode di VS Code
2. Simpan file (Ctrl+S)
3. Buka Terminal, ketik satu per satu:

```
git add .
git commit -m "update website"
git push
```

4. Lalu deploy ulang:
```
vercel --prod --yes
```

5. Tunggu selesai, website sudah terupdate! ✅

---

## RINGKASAN FILE YANG DIBUAT

Berikut semua file yang ada di project:

```
es-teh-solo-pos/
├── .env.local                          ← Kunci rahasia database
├── next.config.ts                      ← Pengaturan Next.js
├── package.json                        ← (otomatis dari create-next-app)
├── public/
│   ├── manifest.json                   ← Supaya bisa jadi app di tablet
│   ├── sw.js                           ← Service worker untuk offline
│   ├── teh-besar.png                   ← Gambar Es Teh Besar
│   └── teh-kecil.png                   ← Gambar Es Teh Kecil
└── src/
    └── app/
        ├── globals.css                 ← Warna dan style dasar
        ├── layout.tsx                  ← Bungkus utama website
        ├── page.tsx                    ← Halaman utama (kasir)
        ├── lib/
        │   └── supabase.ts            ← Koneksi ke database
        └── components/
            ├── Logo.tsx                ← Logo Es Teh Solo
            ├── MenuCard.tsx            ← Kartu menu item
            ├── Cart.tsx                ← Keranjang belanja
            ├── Receipt.tsx             ← Struk pembayaran
            ├── Login.tsx               ← Halaman login
            ├── SalesReport.tsx         ← Laporan penjualan
            └── Expense.tsx             ← Catat pengeluaran
```

---

## TIPS & CATATAN

- **Username & Password default:**
  - Admin: `admin` / `admin123` (bisa lihat laporan)
  - Kasir: `kasir` / `kasir123` (hanya transaksi & pengeluaran)

- **Kalau website error 404 di Vercel:**
  - Cek Framework Preset di Settings → harus **Next.js**
  - Cek Environment Variables sudah diisi

- **Kalau login gagal:**
  - Cek Environment Variables di Vercel sudah benar
  - Cek tabel `users` di Supabase sudah ada datanya

- **Kalau mau ganti harga menu:**
  - Buka file `src/app/page.tsx`
  - Cari bagian `const MENU` di atas
  - Ganti angka `price: 5000` atau `price: 3000` sesuai keinginan
  - Simpan, lalu deploy ulang (lihat Bagian 8)

- **Kalau mau tambah menu baru:**
  - Buka file `src/app/page.tsx`
  - Tambah item baru di array `MENU`, contoh:
    ```tsx
    { id: "etm-jumbo", name: "Es Teh Manis Jumbo", price: 7000, image: "/teh-jumbo.png", category: "original" },
    ```
  - Jangan lupa tambahkan gambar `teh-jumbo.png` di folder `public`

---

Selamat! Kamu sudah berhasil membuat website kasir sendiri dari nol! 🎉🍵
