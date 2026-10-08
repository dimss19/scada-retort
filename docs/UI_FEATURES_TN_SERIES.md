# TN Series Web Control - UI Features & Components List

Dokumen ini berisi daftar lengkap halaman dan elemen UI/Komponen yang dibutuhkan untuk membangun dashboard TN Series. Anda bisa menggunakan daftar ini sebagai referensi untuk menyiapkan aset (icons, ilustrasi) dan komponen (buttons, modals, form inputs, dll) pada platform desain (seperti Stitch).

---

## 1. Halaman Utama (Index TN Controllers)
**Tujuan:** Menampilkan daftar semua perangkat Autonics TN yang terhubung ke sistem.

**Elemen UI / Komponen yang dibutuhkan:**
- **Page Header:** Judul halaman ("TN Controllers") dan tombol "Add New Controller" (Primary Button).
- **Empty State:** Ilustrasi dan teks penunjuk jika belum ada controller yang didaftarkan.
- **Card Grid Layout:** Layout grid responsif untuk menampilkan daftar controller.
- **TN Controller Card (Komponen Reusable):**
  - **Header Card:** Nama controller, Badge Model (TNS/TNH/TNL).
  - **Status Badge:** Indikator Online (Hijau) / Offline (Abu/Merah).
  - **Data Display (Besar):** Dua kotak untuk menampilkan nilai **PV (Present Value)** dan **SV (Set Value)** secara realtime.
  - **Action Buttons:** Tombol "Monitor" (Primary/Accent) dan "Config" (Secondary/Outline).
  - **Dropdown/Icon Menu:** Tombol hapus controller (Destructive).

---

## 2. Halaman Registrasi (Create / Edit Controller)
**Tujuan:** Form untuk menambahkan controller baru ke dalam sistem.

**Elemen UI / Komponen yang dibutuhkan:**
- **Form Layout:** Standard form layout (bisa menggunakan Card atau Container lebar penuh).
- **Text Inputs:** Untuk input "Controller Name".
- **Number Inputs:** Untuk input "Slave ID" (range 1-99).
- **Select / Dropdown:** Untuk Baudrate, Parity, Stop Bits.
- **Radio Cards / Visual Selector:** Untuk memilih **Model Type** (TNS, TNH, TNL). (Lebih bagus jika bentuknya kotak/kartu yang bisa diklik, lengkap dengan deskripsi singkat fitur masing-masing model).
- **Toggle / Radio Group:** Memilih Control Model ("Fixed" atau "Program").
- **Action Buttons:** Tombol "Test Connection" (Ghost/Outline) dan "Save Controller" (Primary).

---

## 3. Halaman Monitoring (Monitor Dashboard)
**Tujuan:** Layar utama bagi operator untuk mengontrol mesin dan melihat data secara realtime. Ini adalah layar yang paling kompleks.

**Elemen UI / Komponen yang dibutuhkan:**
- **Top Bar / Header:**
  - Nama Controller, Info Model, dan Slave ID.
  - **Status Badges:** "Online/Offline" dan "RUN/STOP".
- **Gauge / Meter Components (3 buah):**
  - Komponen visual berbentuk *circular gauge* atau *donut chart* setengah lingkaran untuk menampilkan: **PV (Suhu Aktual)**, **SV (Suhu Target)**, dan **Heating MV (Beban Pemanas %)**.
  - Membutuhkan indikator warna (normal=hijau/biru, warning=kuning, danger=merah).
- **Realtime Line Chart:**
  - Grafik garis (Line Chart) untuk plotting data PV, SV, dan MV selama 30 menit terakhir.
  - Fitur legend (keterangan warna garis) dan sumbu X (waktu), Y (suhu).
- **Quick Control Panel (Card Component):**
  - Input angka besar dengan tombol "SET" di sebelahnya untuk mengubah SV dengan cepat.
  - **Tombol RUN (Hijau) & STOP (Merah)** berukuran besar.
  - Tombol aksi sekunder: "Auto-Tune", "Reset Alarm", toggle "Auto/Manual Mode".
- **Status Panel (Card Component):**
  - **LED/Pill Indicators:** Menampilkan status fisik alat (OUT1, OUT2, AT, MAN). Menyala (berwarna solid) jika aktif, mati (outline abu) jika tidak aktif.
  - **Alarm Indicators (AL1 s/d AL6):** Indikator peringatan. Jika terjadi alarm, warnanya menjadi merah dan berkedip (*pulsing animation*).
  - **Error Alert Banner:** Kotak pesan merah yang muncul *hanya* jika terjadi kerusakan sensor (OPEN / HHHH / LLLL).

---

## 4. Halaman Konfigurasi (Config Parameters)
**Tujuan:** Mengatur ratusan parameter teknis (Modbus Holding Registers) TN Controller.

**Elemen UI / Komponen yang dibutuhkan:**
- **Tab Navigation / Vertical Menu:** Untuk berpindah antar 10 grup parameter (Operation, Multi SV, PID, Input, Control, Pattern, Event, Alarm, Comm, Other).
- **Parameter Form Component (List Item):**
  - Baris untuk setiap parameter yang berisi: Label/Nama, Deskripsi kecil (Tooltip/Help text), Nilai (Input).
  - Mendukung tipe input: **Number Input** (dengan batas min/max), **Select Dropdown** (untuk opsi seperti YES/NO, tipe sensor), dan **Toggle Switch**.
  - **Modified Indicator:** Titik kuning/orange di samping parameter jika nilainya baru diubah tapi belum di-save ke alat.
- **Top/Bottom Action Bar (Sticky):**
  - Tombol "Sync dari Device" (mengambil data dari hardware fisik).
  - Tombol "Simpan Perubahan ke Device" (menyimpan nilai baru ke hardware).

---

## 5. Halaman Daftar Template Resep (Recipe Templates Index)
**Tujuan:** Menampilkan daftar template profil suhu (*pattern*) yang pernah dibuat.

**Elemen UI / Komponen yang dibutuhkan:**
- **Header & Search:** Tombol "Buat Resep Baru" dan kolom pencarian (*search bar*).
- **Recipe List / Table / Cards:**
  - Menampilkan Judul Resep, Jumlah Step, Estimasi Total Waktu, dan Tanggal dibuat.
  - **Dropdown Action:** Edit, Hapus, Apply ke Controller.

---

## 6. Halaman Pembuatan/Edit Template Resep (Recipe Builder)
**Tujuan:** Membangun *pattern control* (step-step waktu dan target suhu).

**Elemen UI / Komponen yang dibutuhkan:**
- **Form Info Dasar:** Nama Resep, Deskripsi, Pilihan satuan waktu (Menit.Detik / Jam.Menit), dan Kondisi Start (SSV/SPV).
- **Steps Table / List Builder:**
  - List baris dinamis yang bisa ditambah/dikurangi (hingga maksimal 20 step).
  - Tiap baris berisi input: Target Suhu (SV) dan Durasi (Waktu).
  - Tombol "Add Step" dan ikon hapus (Trash) di tiap baris.
- **Visual Preview (Timeline Chart):**
  - Komponen grafik yang secara otomatis menggambar/memvisualisasikan kurva profil suhu berdasarkan angka-angka step yang diinputkan pengguna. (Profil menanjak = heating ramp, datar = hold).

---

## 7. Global UI Components (Diperlukan di berbagai layar)
- **Modals / Dialogs:** Untuk konfirmasi tindakan penting (misal: "Hapus Controller?", "Timpa Parameter Alat?").
- **Toasts / Snackbars (Notification):** Pesan popup kecil di pojok layar untuk memberitahu sukses/gagalnya suatu *command* (misal: "Set Value Berhasil Diubah", "Koneksi Gagal").
- **Loaders / Spinners / Skeletons:** Animasi loading saat sedang sinkronisasi data dengan alat Modbus.
