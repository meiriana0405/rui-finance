# Rui Finance

Aplikasi pencatatan keuangan pribadi untuk driver ShopeeFood (React + TypeScript + Tailwind + Supabase + Recharts). Semua pencatatan manual; aplikasi tidak terhubung ke bank atau e-wallet.

## Struktur

```
supabase/schema.sql      skema database + Row Level Security
src/data.tsx             pemuat data, seed awal, hapus transaksi
src/lib/                 supabase, tipe, format, perhitungan, ekspor CSV/PDF
src/components/          UI kit, formulir (pengeluaran, transfer, narik), editor
src/pages/               Dashboard, Transaksi, Narik, Dompet, Laporan, Pengaturan, Login
```

## Menjalankan

1. Buat project di [supabase.com](https://supabase.com), lalu jalankan isi `supabase/schema.sql` di SQL Editor.
2. Salin `.env.example` menjadi `.env`, isi URL dan anon key (Project Settings > API).
3. Install dan jalankan:
   ```bash
   npm install
   npm run dev
   ```
4. Buka aplikasi, daftar dengan email, lalu masuk. Saat pertama masuk, empat akun (BCA, SeaBank, ShopeePay, DANA), kategori, dan pengaturan awal dibuat otomatis.

Jika konfirmasi email membuat repot, matikan di Supabase: Authentication > Providers > Email > Confirm email.

## Deploy (Vercel)

Import repo GitHub, tambahkan dua environment variable `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`, lalu deploy. Perintah build: `npm run build`, output: `dist`.

## Catatan cara kerja

- Saldo akun dihitung dari saldo awal + semua transaksi, jadi edit atau hapus transaksi langsung memperbarui saldo dan laporan.
- Transfer tidak masuk pendapatan maupun pengeluaran. Biaya transfer dicatat sebagai pengeluaran terpisah.
- Untung bersih = pendapatan ShopeeFood − biaya kerja. Pengeluaran pribadi ditampilkan terpisah.
- Alokasi dihitung dari pendapatan setelah biaya kerja. Jika bensin hari itu belum dicatat, estimasi bensin dipakai; setelah dicatat, estimasi tidak dihitung lagi.
- Alokasi hanyalah catatan virtual dan tidak menambah saldo rekening.
