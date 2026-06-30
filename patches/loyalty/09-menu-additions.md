# Menu Additions

## Tambah link ke Loyalty Config di menu navigasi

### Di POS page (src/app/pos/page.tsx) — di bagian menu dropdown admin:

Tambahkan setelah button "🏷️ Diskon":

```tsx
<button onClick={() => { setShowMenu(false); router.push('/admin/loyalty') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🎁 Loyalty</button>
```

### Di Admin page (src/app/admin/page.tsx) — di bagian menu dropdown:

Tambahkan setelah button "🏷️ Diskon":

```tsx
<button onClick={() => { setShowMenu(false); router.push('/admin/loyalty') }} className="w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition">🎁 Loyalty</button>
```
