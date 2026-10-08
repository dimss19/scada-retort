# 🥫 SCADA Retort — CV Indah Mesin

Sistem Monitoring, Kontrol, dan Kalkulasi Nilai Letalitas Termal ($F_0$) Mesin Retort Sterilisasi Makanan berbasis Web SCADA Industrial.

---

## 📋 Ikhtisar Sistem Web SCADA

Aplikasi ini dirancang khusus untuk memonitoring dan mengendalikan proses sterilisasi retort secara presisi dengan fitur utama:
- **Kalkulasi Nilai $F_0$ Real-Time**: Perhitungan otomatis akumulasi letalitas sterilisasi metode trapesium secara matematis.
- **Komunikasi Hardware Multi-Jalur**:
  - **Web Serial API**: Pembacaan langsung kabel USB RS-485 dari web browser ke controller suhu Autonics TN Series (9600 baud, 8-N-1).
  - **ESP32 Logger (WiFi / AP / MQTT)**: Datalogger nirkabel multi-probe temperatur dan tekanan.
  - **Python Modbus Bridge**: Background daemon opsional untuk integrasi lokal/jaringan.
- **Recipe & Pattern Manager**: Pengaturan pola kenaikan suhu bertahap (Ramp/Soak), waktu holding steril, dan pendinginan.
- **Electronic Batch Record & Historian**: Pencatatan log batch steril otomatis, tanda tangan verifikasi mutu, dan cetak laporan resmi browser.
- **Web Installer 7-Langkah**: Wizard pengaturan awal database, konfigurasi server, dan sistem aktivasi instalasi.

---

## 📁 Struktur Direktori Repositori Web

Repositori ini berfokus murni pada aplikasi Web SCADA:

```text
scadaretort/
├── app/                  # Controller, Models, Services, & Logika Bisnis Laravel
├── bootstrap/            # Inisialisasi framework & providers
├── config/               # Konfigurasi aplikasi, database, cache, serial, dll.
├── database/             # Migrasi tabel dan database SQLite/MySQL
├── deploy/               # Skrip otomatisasi deployment server VPS Ubuntu
│   ├── deploy.sh         # Skrip rilis domain produksi
│   ├── deploy_dns.sh     # Konfigurasi SSL & domain
│   ├── setup_vps.sh      # Instalasi environment server (PHP, Nginx, Redis)
│   └── README.md         # Panduan deployment VPS
├── docs/                 # Dokumentasi spesifikasi teknik & standar operasional
│   ├── TN-Modbus/        # Peta register Modbus RTU Autonics TN Series
│   ├── PRD.md            # Product Requirement Document
│   ├── WORKFLOW.md       # Alur kerja operasional mesin retort
│   ├── SCADA_DESIGN_SPECIFICATION.md
│   ├── F0_CALCULATION_FORMULA.md
│   └── README.md         # Indeks dokumentasi lengkap
├── drivers/              # Driver USB to RS-485 (CH340/CH341) untuk koneksi browser
├── public/               # Asset publik web dan entry point index.php
├── resources/            # Frontend (Inertia.js, Vue 3 / React, Blade views, CSS)
├── firmware/             # Firmware ESP32 Datalogger Hardware (Arduino / C++)
├── routes/               # Routing web, API, autentikasi, & web installer
│   ├── web.php           # Rute utama aplikasi web SCADA Retort
│   ├── api.php           # Endpoint REST API kontroler & mesin
│   └── installer.php     # Wizard Web Installer 7-langkah
├── scripts/              # Skrip pendukung komunikasi Python & Modbus bridge
├── storage/              # Cache aplikasi, log, dan database SQLite lokal
└── tests/                # Unit test dan Feature test Laravel
```

---

## 🚀 Panduan Menjalankan Web SCADA

### Persyaratan Sistem
- **PHP** 8.2 atau lebih baru
- **Composer** 2.x
- **Node.js** 18+ & **NPM**
- **Web Browser Modern**: Google Chrome / Microsoft Edge / Opera (Mendukung Web Serial API untuk koneksi langsung RS-485)

### 1. Instalasi Dependensi
```bash
composer install
npm install
```

### 2. Konfigurasi Lingkungan (.env)
Salin berkas konfigurasi lingkungan jika baru pertama kali menjalankan:
```bash
cp .env.example .env
php artisan key:generate
```

### 3. Migrasi Database
```bash
php artisan migrate
```

### 4. Menjalankan Server Lokal (Development)
Jalankan server frontend dan backend:
```bash
# Terminal 1: Kompilasi frontend
npm run dev

# Terminal 2: Server Laravel
php artisan serve
```
Akses aplikasi melalui browser di `http://localhost:8000` atau `http://scadaretort.test` (jika menggunakan Laragon).

---

## 🏢 Hak Cipta & Pengembang

Dikembangkan secara khusus untuk operasional mesin retort industrial oleh:
**CV Indah Mesin** — Solusi Otomasi & Mesin Industri Makanan.
