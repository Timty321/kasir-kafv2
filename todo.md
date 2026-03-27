Berikut adalah format Todo List yang lebih rapi dan terstruktur untuk pengembangan sistem **KASIR KAF**, dengan pembagian prioritas dan detail operasional:

# 📋 ROADMAP PENGEMBANGAN KASIR KAF
---

## 🟢 1. Komunikasi & Notifikasi
- [ ] **Optimasi WhatsApp Gateway**
    - [ ] Merapikan Setiap Message yang ada agar lebih informatif
    - [ ] Setiap terjadi penjualan akan ada live stock yang terkirim, dan juga setiap 1 jam akan ada message live stock yang terkirim ke WA.

## 🔵 2. Modul Finance (Inti Keuangan)
- [ ] **Income (Pemasukan)**
    - [ ] Pencatatan otomatis dari setiap transaksi kasir.
    - [ ] Klasifikasi pemasukan berdasarkan kategori menu (Ayam Original, Paket Nasi, dll).
- [ ] **Expense (Pengeluaran)**
    - [ ] Input biaya bahan baku (Ayam P10/P14, Minyak Padat, Tepung Mix, dll).
    - [ ] Input biaya operasional (Sewa Outlet: Rp500.000/bulan).
    - [ ] Pencatatan pengeluaran tak terduga (Listrik, Gas, Air).
- [ ] **Salary Management (Sistem Gaji & Presensi)**
    - [ ] Kalkulasi Gaji Karyawan (Base: Rp1.000.000 / 2 Karyawan).
    - [ ] Logika pemotongan gaji otomatis berdasarkan persentase kehadiran (Pro-rata).
    - [ ] Ada fitur dimana owner dapat melihat seperti tabel kalender di tanggal berapa berapa saja karyawan masuk dan tidak masuk.
    - NOTE: saya memiliki 2 karyawan.
- [ ] **Profit and Loss (Laba Rugi)**
    - [ ] Dashboard visual keuntungan bersih (Omzet - HPP - Operasional).
    - [ ] Perhitungan margin per produk.
- [ ] **Reporting (Laporan)**
    - [ ] Filter laporan harian, mingguan, dan bulanan.
    - [ ] Fitur cetak/export laporan ke PDF/Excel.

## 🟡 3. Employee Management (SDM)
- [ ] **Sistem Login & Keamanan**
    - [ ] Pembuatan 2 Akun Karyawan dengan Password unik.
    - [ ] Pembatasan hak akses (Karyawan hanya bisa akses Kasir, Owner bisa akses Finance).
- [ ] **Sistem Absensi Digital**
    - [ ] Logika "Login = Absen Masuk".
    - [ ] Rekapitulasi jumlah hari kerja per karyawan secara otomatis untuk dasar perhitungan gaji.

## 🔴 4. Inventory Control (Tambahan)
- [ ] **Auto-Stock Update**
    - [ ] Pengurangan stok bahan baku otomatis setiap kali menu terjual.
    - [ ] Notifikasi "Low Stock" untuk item krusial (seperti Minyak Padat atau Ayam).

LIST BAHAN BAKU & BIAYA OPERASIONAL:
Product: Ayam Marinasi P10 
PRICE: 50.000/each

Product: Ayam Marinasi P14
PRICE: 50.000/each

Product: Sauce Tomat KAF
PRICE: 37.000/each

Product: Sauce Sambal KAF
PRICE: 39.500/each

Product: Tepung Mix KAF
Price: 19.000/each

Product: Box Ayam Nasi KAF
Price: 1.000/each

Product: Kertas Ayam KAF
Price: 400/each

Product: Cheese Powder
Price: 34.000/each

Product: Kantong Plastik Kecil
Price: 35.000/each

Product: Kantong Plastik Sedang
Price: 11.500/each

Product: Sauce Black Pepper
Price: 57.000/each

Product: Box Kulit KAF
Price: 500/each

Product: Kulit Ayam KAF
Price: 42.000/each

Product: Tepung Mix KAF
Price: 19.000/each

Product: Minyak Padat KAF
Price: 355.000/each

Biaya Operasional: 
- Gaji Karyawan 1.000.000 / Jumlah Karyawan 
- Sewa Outlet 500.000/bulan