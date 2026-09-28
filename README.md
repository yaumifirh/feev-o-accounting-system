**FEEV-O Accounting System**

FEEV-O Accounting System adalah web-based accounting system yang dirancang untuk membantu pengelolaan persediaan dan pencatatan akuntansi pada perusahaan distributor makanan dan minuman dengan menggunakan **metode FIFO (First In, First Out)**.

🌐 Live Web App

👉 **[Buka FEEV-O Accounting System](https://yaumifirh.github.io/feev-o-accounting-system/)**

Aplikasi dapat digunakan dengan akun bebas secara langsung melalui link di atas.



**📌 Tentang Sistem**

FEEV-O Accounting System dikembangkan sebagai sistem informasi akuntansi berbasis web yang mengintegrasikan pengelolaan data master, transaksi persediaan, perhitungan HPP dengan metode FIFO, pencatatan jurnal, serta penyajian laporan keuangan.

Sistem ini dibuat dengan konsep sederhana, terintegrasi, dan mudah digunakan untuk mendukung proses pencatatan akuntansi persediaan.



**✨ Fitur Utama**

### 1. Master Data

* Master Produk
* Master Supplier
* Master Pelanggan
* Pengelolaan kategori produk
* Pengelolaan data persediaan

### 2. Transaksi Pembelian

* Pencatatan transaksi pembelian
* Penambahan stok berdasarkan transaksi pembelian
* Pembentukan layer persediaan FIFO
* Pengelolaan harga perolehan persediaan

### 3. Transaksi Penjualan

* Pencatatan transaksi penjualan
* Pengurangan stok berdasarkan metode FIFO
* Pencatatan pelanggan
* Perhitungan HPP secara otomatis

### 4. Persediaan FIFO

* Kartu persediaan
* Pengelolaan layer persediaan
* Penerapan metode First In, First Out
* Pemantauan jumlah persediaan
* Pencatatan persediaan yang habis, kedaluwarsa, atau rusak

### 5. Jurnal Akuntansi

Sistem mendukung pencatatan jurnal yang berkaitan dengan transaksi, termasuk:

* Pembelian
* Penjualan
* HPP
* Persediaan
* Kerugian persediaan

### 6. Laporan

Sistem menyediakan beberapa laporan, antara lain:

* Laporan HPP
* Laporan Penjualan
* Laporan Laba Rugi
* Kartu Persediaan

Laporan tertentu juga dapat dicetak dalam format PDF.



## 🛠️ Teknologi yang Digunakan

### Frontend

* HTML
* CSS
* JavaScript

### Backend & Database

* Supabase
* PostgreSQL
* SQL

### Development Tools

* Visual Studio Code
* Git
* GitHub
* GitHub Pages

---

## 🗂️ Struktur Project

UTS PENGKODEAN/
│
├── Backend/
│   └── database.sql
│
├── Frontend/
│   ├── CSS/
│   │   ├── login.css
│   │   ├── splash.css
│   │   └── style.css
│   │
│   ├── HTML/
│   │   ├── dashboard.html
│   │   ├── login.html
│   │   └── splash.html
│   │
│   └── JS/
│       ├── app.js
│       ├── auth.js
│       ├── config.js
│       └── splash.js
│
└── index.html


## 🔄 Alur Sistem

Login
   ↓
Dashboard
   ↓
Master Data
   ├── Produk
   ├── Supplier
   └── Pelanggan
   ↓
Pembelian
   ↓
Layer Persediaan FIFO
   ↓
Penjualan
   ↓
Perhitungan HPP
   ↓
Jurnal Akuntansi
   ↓
Laporan


## 📊 Konsep FIFO

Sistem menggunakan metode **First In, First Out (FIFO)** dalam menentukan biaya persediaan yang dikeluarkan ketika terjadi penjualan.

Persediaan yang diperoleh terlebih dahulu akan dianggap sebagai persediaan yang dijual terlebih dahulu.

Dengan pendekatan ini, sistem dapat membantu menghasilkan:

* Perhitungan HPP
* Nilai persediaan akhir
* Kartu persediaan
* Informasi layer persediaan


## 🔐 Akses Demo

FEEV-O menggunakan mekanisme **demo login** untuk kebutuhan pengujian aplikasi.

Pengguna dapat memasukkan:

* Email apa saja
* Password apa saja

Login tersebut digunakan untuk mengakses sistem dalam lingkungan demo.


## 🎯 Tujuan Pengembangan

Sistem ini dikembangkan untuk:

1. Menerapkan konsep akuntansi persediaan menggunakan metode FIFO.
2. Mengintegrasikan transaksi pembelian dan penjualan dengan pencatatan akuntansi.
3. Mengotomatisasi perhitungan Harga Pokok Penjualan (HPP).
4. Menyediakan kartu persediaan dan laporan akuntansi.
5. Menerapkan konsep database menggunakan Supabase dan PostgreSQL.
6. Mengembangkan aplikasi akuntansi berbasis web yang dapat diakses secara online.


👩‍💻 Pengembangan

**FEEV-O Accounting System**

Accounting Web Application
Universitas Diponegoro


🔗 Links

🌐 **Live Web App:**
https://yaumifirh.github.io/feev-o-accounting-system/

💻 **GitHub Repository:**
https://github.com/yaumifirh/feev-o-accounting-system
