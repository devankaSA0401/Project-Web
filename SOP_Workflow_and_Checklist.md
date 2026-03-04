# SOP & Panduan Workflow: Toko NADYN POS

Dokumen ini berisi penjelasan detail dan checklist (tugas) terkait proses berjalannya aplikasi *Toko NADYN POS* dari simulasi berbagai sudut pandang (Peran).

---

## 👨‍💼 1. Sebagai Owner (Pemilik Toko)
Sebagai pemilik toko (User: `admin`), Anda memiliki akses *Super Admin* ke semua fitur. Fokus Anda adalah memastikan data awal benar, mengatur stok, dan menganalisa keuangan operasional toko.

### ✅ Checklist Task Owner (Setup Awal)
*   [ ] **Login Utama**: Pastikan login sebagai `admin` berhasil lalu muncul halaman Dashboard (selaku halaman monitor).
*   [ ] **Input Master Data Supplier**: Masuk ke menu `Master Data > Supplier`. Tambahkan minimal 1-3 Supplier langganan. (Misal: Agen Kabel, Gudang Lampu JKT).
*   [ ] **Input Master Data Barang**: Masuk ke menu `Master Data > Barang`. Daftarkan seluruh barang dan tentukan harga beli (HPP) serta harga jual dengan akurat.
*   [ ] **Menyesuaikan Tipe Barang Meteran**: Jika ada barang kabel roll/pipa (yang dijual meteran), **ceklis** fitur "Barang dijual per meter" saat menambahkannya.
*   [ ] **Membuat Master Data Kustomer (Opsional)**: Masuk ke menu `Master Data > Customer`. Toko bisa menginput daftar pelanggan langganan jika ada pelanggan yang rutin ngutang atau PO khusus.

### ✅ Checklist Task Owner (Pengawasan Keuangan)
*   [ ] **Memantau Uang Kas Toko**: Menu `Manajemen Kas`. Jika ada uang dipakai buat beli kopi tukang (biaya), token listrik, bensin operasional — pastikan Owner melapor di menu ini.
*   [ ] **Laporan Dashboard Realtime**: Buka menu `Dashboard`. Periksa apakah pendapatan hari itu, kas aktif, dan **Top 10 Fast Moving** (barang jagoan) akurat.
*   [ ] **Laporan Akuntansi Laba/Rugi**: Seminggu sekali (atau sebulan), Owner masuk ke menu `Akuntansi`. Melihat **Buku Besar / Neraca** dan **Laba Rugi** untuk tau net profit harian dari semua penjualan dikurang operasional toko.
*   [ ] **Laporan PDF**: Download file Laporan berupa file `.pdf` dari Tab laporan untuk diserahkan ke investor atau disimpen dalam map print-out.

---

## 🚚 2. Sebagai Supplier (Penyuplai & Pembelian Stok)
Supplier tidak memiliki akun login sendiri, melainkan keberadaannya **dikelola oleh Owner**. Siklus ini terjadi saat toko belanja barang.

### ✅ Checklist Task Pembelian ke Supplier
*   [ ] **Cek Persediaan Habis**: Buka `Barang` atau `Manajemen Stok`, filter barang yang indikatornya "Merah" (Stok Menipis).
*   [ ] **Input Order Pembelian**: Buka menu `Pembelian`. Klik "➕ Input Pembelian", masukkan **No. Faktur (Invoice)** dari vendor/supplier, dan cari nama si Supplier dari drop-down.
*   [ ] **Belanja Sistem Hutang (Tempo)**: Jika toko membeli *Tempo* kepada Supplier, JANGAN centang checkbox ("Faktur Ini LUNAS"). Otomatis sistem akan mengkalkulasi ini masuk ke data "Hutang Supplier".
*   [ ] **Penerimaan Barang Fisik**: Setelah klik simpan, stok gudang otomatis akan bertambah dengan jumlah barang (Qty) yang sudah dibeli tadi. (Cek History Pergerakan di Menu Stok – tercatat debet *Stok IN*).
*   [ ] **Membayar Cicilan (Hutang Supplier)**: Jika beli barang tempo, buka menu `Pembelian > Hutang Supplier`. Klik **"Cicil Bayar"** untuk mengangsur hutang. Saldo hutang otomatis dipotong dan "Kas Keluar" akan tercetak di Akuntansi keuangan (dikurangi).

---

## 👩‍💻 3. Sebagai Kasir (Front-End Sales)
Kasir (User: `kasir`) adalah perwakilan ujung tombak toko ritel yang fokus pada satu layar: Halaman `Menu Kasir` (POS). Mode Kasir **tidak bisa** menghapus produk utama atau memanipulasi laba rugi.

### ✅ Checklist Task Kasir di Lapangan
*   [ ] **Login Kasir**: Login pakai username `kasir` (tampilan menu kiri lebih ringkas).
*   [ ] **Navigasi Kategori Kasir**: Masuk ke menu `Kasir (POS)`. Klik block gambar kategori besar (Misal: Lampu, Kabel, dll) untuk melihat *display etalase digital*.
*   [ ] **Scan Barcode**: Saat pelanggan bawa barang ke meja, Tembak label Barcode menggunakan alat scanner. Scanner akan *otomatis menekan "ENTER"* dan produk langsung pindah ke **Keranjang (Cart)** kanan dengan jumlah +1.
*   [ ] **Edit Qty Keranjang**: Klik tulisan angka (Qty) di keranjang, lalu **Ketik Manual** angkanya atau pencet (+) terus-menerus.
*   [ ] **Input Jual Meteran (Kabel / Tali)**: Apabila kasir men-Scan produk "Kabel Roll", maka kasir *wajib* disuguhkan *Pop-Up Input Panjang* (Misal 50.5 Meter).
*   [ ] **Ganti Pelanggan**: Jika si pelanggan adalah pelanggan tercatat (Misal *Bapak Mandor Proyek*), di keranjang sisi atas klik `Umum / Walk-in` dan cari nama pak Mandor tersebut (agar notanya tertulis nama spesifik).
*   [ ] **Proses Pembayaran (Nota Preview)**: Klik **"BAYAR SEKARANG"**. Masukkan nominal uang yang diserahkan pelanggan (Misal belanja Rp15.000, bayar Rp50.000). Sistem lalu akan men-generate kembalian otomatis.
*   [ ] **Approval Nota Sebelum Print**: Sebelum dicetak, cek **Pratinjau Struk (Nota)**. Pastikan daftar barang dan nama kasir benar, lalu klik "Simpan & Cetak". Transaksi terekam!

---

## 👨‍🔧 4. Sebagai Customer (Pelanggan)
Customer tidak login ke aplikasi. Mereka adalah entitas yang membeli barang di atas meja administrasi dan juga berinteraksi dengan "Bon".

### ✅ Skenario Kasus Customer
*   [ ] **Customer Baru / Eceran (Walk-In)**: Pelanggan yang datang, beli Bohlam 1 buah langsung bayar kas dan pergi. Nama di struknya "Customer: Umum". Kas masuk ke laci.
*   [ ] **Customer Langganan Request Bukti**: Setelah kasir mem-proses nota. Customer akan diberikan lembar "Thermal Print" (struk kecil) atau "A4 Print" dari peramban yang menunjukkan logo Toko NADYN POS dan harga rinci per satuan.

---

## 📉 5. Sebagai Akuntan / Sistem Automasi (Sistem Belakang Layar)
Sistem memiliki logic otomatis memotong atau menambah jurnal akuntansi **tanpa harus Anda memiliki skill Akuntansi manual**. Semuanya sudah *Double Entry* jurnal yang otomatis *Behind The Scenes*.

### ✅ Checklist Alur Keuangan Toko Anda (The "Under The Hood" Flow)
*   [ ] *Kasus Kasir Mencetak Nota / Transaksi*:
    *   Sistem mengurangi "Aktiva / Persediaan Stok (Qty)".
    *   Sistem mencatat "Aktiva / Kas (Kas bertambah karena user bayar Tunai/Transfer/QRIS)".
    *   Sistem mencatat "Pasiva / Pendapatan Penjualan".
*   [ ] *Kasus Owner Membeli Stok Baru Tunai*:
    *   Sistem mengurangi "Aktiva / Kas (Sering disebut Kas Keluar)".
    *   Sistem menambah "Aktiva / Persediaan Stok".
*   [ ] *Kasus Owner Bayar Biaya Sampah (Manajemen Kas Out)*:
    *   Sistem mengurangi "Aktiva / Kas".
    *   Sistem menambahkan "Biaya Operasional". Laba langsung kepotong (Rugi membesar).

*(Cukup periksa Menu `Akuntansi > Buku Jurnal` untuk melihat mesin secara ajaib mencatat semua transaksi secara matematis seimbang dalam mata uang IDR format Indonesia (`xx.xxx.xxx`)).*
